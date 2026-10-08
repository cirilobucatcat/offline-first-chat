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
  type LinkSessionUpdate,
} from './deviceLink';
import { privateKeyMatchesPublicKey } from './keyManager';

function generateIdentity() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

/** Runs both halves of the handshake and returns what the new device then sees. */
async function runHandshake() {
  const session = await createLinkSession('alice');
  const pending = setDoc.mock.calls[0][1] as DocumentData;

  const identity = await generateIdentity();
  await completeLinkSession(
    'alice',
    session.sessionId,
    pending.newDeviceEphemeralPublicKey,
    identity.privateKey,
  );
  const ready = setDoc.mock.calls[1][1] as DocumentData;

  return { session, identity, pending, ready, update: { ...pending, ...ready } as LinkSessionUpdate };
}

beforeEach(() => {
  setDoc.mockReset();
  setDoc.mockResolvedValue(undefined);
  getDoc.mockReset();
});

describe('device linking', () => {
  it('starts a pending session with an eight-character code that expires in five minutes', async () => {
    const before = Date.now();

    const session = await createLinkSession('alice');

    expect(session.code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(session.expiresAt - before).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(session.expiresAt - before).toBeLessThan(5 * 60 * 1000 + 5000);

    const [ref, data] = setDoc.mock.calls[0];
    expect(ref).toBe(`users/alice/linkSessions/${session.code}`);
    expect(data.status).toBe('pending');
    expect(data.expiresAt.toMillis()).toBe(session.expiresAt);
    expect(data.newDeviceEphemeralPublicKey).not.toHaveProperty('d');
  });

  it('gives the new device the identity private key', async () => {
    const { session, identity, update } = await runHandshake();

    const received = await acceptLinkSession(session.ephemeralKeyPair, session.sessionId, update);

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

  it('cannot be unwrapped under a different session code', async () => {
    const { session, update } = await runHandshake();

    await expect(acceptLinkSession(session.ephemeralKeyPair, 'WRNGCODE', update)).rejects.toThrow();
  });

  it('cannot be unwrapped by a device that did not start the session', async () => {
    const { session, update } = await runHandshake();
    const stranger = await generateIdentity();

    await expect(acceptLinkSession(stranger, session.sessionId, update)).rejects.toThrow();
  });

  it('refuses to accept a session that is still pending', async () => {
    const { session, pending } = await runHandshake();

    await expect(
      acceptLinkSession(session.ephemeralKeyPair, session.sessionId, pending as LinkSessionUpdate),
    ).rejects.toThrow();
  });
});

describe('findLinkSession', () => {
  function sessionDoc(data?: DocumentData) {
    return { exists: () => data !== undefined, data: () => data };
  }
  const inFuture = () => Timestamp.fromMillis(Date.now() + 60_000);

  it('returns a live pending session', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: inFuture() }));

    expect(await findLinkSession('alice', 'ABCD2345')).toMatchObject({ status: 'pending', sessionId: 'ABCD2345' });
  });

  it('returns null for a code that does not exist', async () => {
    getDoc.mockResolvedValue(sessionDoc());

    expect(await findLinkSession('alice', 'ABCD2345')).toBeNull();
  });

  it('returns null for an expired code', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'pending', expiresAt: Timestamp.fromMillis(Date.now() - 1000) }));

    expect(await findLinkSession('alice', 'ABCD2345')).toBeNull();
  });

  it('returns null for a code that was already used', async () => {
    getDoc.mockResolvedValue(sessionDoc({ status: 'ready', expiresAt: inFuture() }));

    expect(await findLinkSession('alice', 'ABCD2345')).toBeNull();
  });
});
