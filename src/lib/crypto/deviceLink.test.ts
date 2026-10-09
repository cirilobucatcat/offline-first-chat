import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp, type DocumentData } from 'firebase/firestore';

// Firestore is only the relay between the two devices, so the test captures
// what each device writes and hands it to the other.
const { setDoc, getDoc } = vi.hoisted(() => ({ setDoc: vi.fn(), getDoc: vi.fn() }));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  doc: (_db: unknown, ...path: string[]) => path.join('/'),
  setDoc,
  getDoc,
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

import {
  acceptLinkSession,
  completeLinkSession,
  createLinkSession,
  findLinkSession,
  formatLinkCode,
  normalizeLinkCode,
  type LinkSessionUpdate,
} from './deviceLink';
import { privateKeyMatchesPublicKey } from './keyManager';

function generateIdentity() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

function sessionDoc(data?: DocumentData) {
  return { exists: () => data !== undefined, data: () => data };
}

/**
 * Runs both halves of the handshake and returns what the new device then
 * sees. `tamper` stands in for someone who can write the session doc: it
 * changes the pending session before the primary device reads it.
 */
async function runHandshake(tamper?: (pending: DocumentData) => DocumentData) {
  const session = await createLinkSession('alice');
  const [pendingRef, written] = setDoc.mock.calls[0] as [string, DocumentData];
  const pending = tamper ? tamper(written) : written;

  // The primary device only has the code the user typed, so it finds the
  // session only if it derives the same document ID from it.
  getDoc.mockImplementation(async (ref: string) => sessionDoc(ref === pendingRef ? pending : undefined));
  const found = await findLinkSession('alice', session.code);
  if (!found) throw new Error('the primary device did not find the session');

  const identity = await generateIdentity();
  await completeLinkSession('alice', found, identity.privateKey);
  const ready = setDoc.mock.calls[1][1] as DocumentData;

  return { session, identity, pending, ready, update: { ...pending, ...ready } as LinkSessionUpdate };
}

beforeEach(() => {
  setDoc.mockReset();
  setDoc.mockResolvedValue(undefined);
  getDoc.mockReset();
});

describe('device linking', () => {
  it('starts a pending session with a sixteen-character code that expires in five minutes', async () => {
    const before = Date.now();

    const session = await createLinkSession('alice');

    expect(session.code).toMatch(/^[2-9A-HJ-NP-Z]{16}$/);
    expect(session.expiresAt - before).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(session.expiresAt - before).toBeLessThan(5 * 60 * 1000 + 5000);

    const [ref, data] = setDoc.mock.calls[0];
    expect(session.sessionId).toMatch(/^[0-9a-f]{32}$/);
    expect(ref).toBe(`users/alice/linkSessions/${session.sessionId}`);
    expect(data.status).toBe('pending');
    expect(data.expiresAt.toMillis()).toBe(session.expiresAt);
    expect(data.newDeviceEphemeralPublicKey).not.toHaveProperty('d');
  });

  it('gives the new device the identity private key', async () => {
    const { session, identity, update } = await runHandshake();

    const received = await acceptLinkSession(session, update);

    expect(await privateKeyMatchesPublicKey(received, identity.publicKey)).toBe(true);
    const sentJwk = await crypto.subtle.exportKey('jwk', identity.privateKey);
    const receivedJwk = await crypto.subtle.exportKey('jwk', received);
    expect(receivedJwk.d).toBe(sentJwk.d);
  });

  it('writes only the wrapped key to Firestore', async () => {
    const { ready } = await runHandshake();

    expect(Object.keys(ready).sort()).toEqual([
      'primaryDeviceEphemeralPublicKey',
      'status',
      'wrappedPrivateKey',
      'wrappedPrivateKeyIv',
    ]);
    expect(ready.status).toBe('ready');
    expect(ready.primaryDeviceEphemeralPublicKey).not.toHaveProperty('d');
    expect(ready.wrappedPrivateKeyIv.toUint8Array()).toHaveLength(12);
    expect(setDoc.mock.calls[1][2]).toEqual({ merge: true });
  });

  it('never writes the code to Firestore', async () => {
    const { session } = await runHandshake();

    expect(setDoc).toHaveBeenCalledTimes(2);
    for (const [ref, data] of setDoc.mock.calls) {
      expect(ref).not.toContain(session.code);
      expect(JSON.stringify(data)).not.toContain(session.code);
    }
  });

  it('does not hand the key to a device that put its own ephemeral key in the session', async () => {
    // The attacker can read and write the session doc but never saw the
    // code. A second session stands in for their best guess at it.
    const attacker = await generateIdentity();
    const attackerPublicJwk = await crypto.subtle.exportKey('jwk', attacker.publicKey);
    const guess = await createLinkSession('alice');
    setDoc.mockClear();

    const { session, update } = await runHandshake((pending) => ({
      ...pending,
      newDeviceEphemeralPublicKey: attackerPublicJwk,
    }));

    await expect(
      acceptLinkSession({ ...session, ephemeralKeyPair: attacker, codeSecret: guess.codeSecret }, update),
    ).rejects.toThrow();
    // The code is the only thing in the way: with it, the same attempt works.
    await expect(acceptLinkSession({ ...session, ephemeralKeyPair: attacker }, update)).resolves.toBeDefined();
    // The device that did start the session gets nothing it can use.
    await expect(acceptLinkSession(session, update)).rejects.toThrow();
  });

  it('cannot be unwrapped under a different code', async () => {
    const other = await createLinkSession('alice');
    setDoc.mockClear();
    const { session, update } = await runHandshake();

    await expect(acceptLinkSession({ ...session, codeSecret: other.codeSecret }, update)).rejects.toThrow();
  });

  it('cannot be unwrapped by a device that did not start the session', async () => {
    const { session, update } = await runHandshake();
    const stranger = await generateIdentity();

    await expect(acceptLinkSession({ ...session, ephemeralKeyPair: stranger }, update)).rejects.toThrow();
  });

  it('refuses to accept a session that is still pending', async () => {
    const { session, pending } = await runHandshake();

    await expect(acceptLinkSession(session, pending as LinkSessionUpdate)).rejects.toThrow();
  });
});

describe('findLinkSession', () => {
  const CODE = 'ABCD2345EFGH6789';
  const inFuture = () => Timestamp.fromMillis(Date.now() + 60_000);

  it('returns a live pending session, looked up without the code', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: inFuture() }));

    const found = await findLinkSession('alice', CODE);

    expect(found).toMatchObject({ status: 'pending' });
    expect(found?.sessionId).toMatch(/^[0-9a-f]{32}$/);
    expect(getDoc).toHaveBeenCalledWith(`users/alice/linkSessions/${found?.sessionId}`);
  });

  it('finds the same session however the code was typed', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: inFuture() }));

    const typedExactly = await findLinkSession('alice', CODE);
    const typedLoosely = await findLinkSession('alice', ' abcd 2345-efgh 6789 ');

    expect(typedLoosely?.sessionId).toBe(typedExactly?.sessionId);
  });

  it('looks in a different place for another account or another code', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: inFuture() }));

    const mine = await findLinkSession('alice', CODE);
    const otherAccount = await findLinkSession('bob', CODE);
    const otherCode = await findLinkSession('alice', 'ABCD2345EFGH678A');

    expect(otherAccount?.sessionId).not.toBe(mine?.sessionId);
    expect(otherCode?.sessionId).not.toBe(mine?.sessionId);
  });

  it('returns null for a code of the wrong length, without a lookup', async () => {
    expect(await findLinkSession('alice', 'ABCD2345')).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('returns null for a code that does not exist', async () => {
    getDoc.mockResolvedValue(sessionDoc());

    expect(await findLinkSession('alice', CODE)).toBeNull();
  });

  it('returns null for an expired code', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: Timestamp.fromMillis(Date.now() - 1000) }));

    expect(await findLinkSession('alice', CODE)).toBeNull();
  });

  it('returns null for a code that was already used', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'ready', expiresAt: inFuture() }));

    expect(await findLinkSession('alice', CODE)).toBeNull();
  });
});

describe('link code formatting', () => {
  it('shows the code in groups of four and reads it back', () => {
    expect(formatLinkCode('ABCD2345EFGH6789')).toBe('ABCD 2345 EFGH 6789');
    expect(formatLinkCode('ABCD23')).toBe('ABCD 23');
    expect(formatLinkCode('')).toBe('');
    expect(normalizeLinkCode(formatLinkCode('ABCD2345EFGH6789'))).toBe('ABCD2345EFGH6789');
  });
});
