import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredIdentityKeyPair } from './keyStore';

// An in-memory key store and a fake users/{uid} doc stand in for IndexedDB
// and Firestore.
const { localKeys, getDoc, setDoc } = vi.hoisted(() => ({
  localKeys: new Map<string, StoredIdentityKeyPair>(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...path: string[]) => path.join('/'),
  getDoc,
  setDoc,
}));
vi.mock('./keyStore', () => ({
  getStoredKeyPair: async (uid: string) => localKeys.get(uid) ?? null,
  saveKeyPair: async (entry: StoredIdentityKeyPair) => {
    localKeys.set(entry.uid, entry);
  },
  deleteStoredKeyPair: async (uid: string) => {
    localKeys.delete(uid);
  },
}));

import { getOrCreateIdentityKeyPair, privateKeyMatchesPublicKey } from './keyManager';

function generateIdentity() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

function userDoc(data?: Record<string, unknown>) {
  return { exists: () => data !== undefined, data: () => data };
}

beforeEach(() => {
  localKeys.clear();
  getDoc.mockReset();
  setDoc.mockReset();
  setDoc.mockResolvedValue(undefined);
});

describe('getOrCreateIdentityKeyPair', () => {
  it('returns the key this device already holds without asking Firestore', async () => {
    const mine = await generateIdentity();
    localKeys.set('alice', { uid: 'alice', ...mine, createdAt: 1 });

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result).toEqual({ status: 'existing', keyPair: mine });
    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('asks for linking, and generates nothing, when the account already has a published key', async () => {
    const otherDevice = await generateIdentity();
    const publishedJwk = await crypto.subtle.exportKey('jwk', otherDevice.publicKey);
    getDoc.mockResolvedValue(userDoc({ name: 'Alice', publicKey: publishedJwk }));

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result).toEqual({ status: 'needs-link', publicKeyJwk: publishedJwk });
    // Publishing here would replace the account's key and break every existing message.
    expect(setDoc).not.toHaveBeenCalled();
    expect(localKeys.has('alice')).toBe(false);
  });

  it('creates, saves and publishes a key only when neither exists', async () => {
    getDoc.mockResolvedValue(userDoc({ name: 'Alice' }));

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result.status).toBe('created');
    expect(localKeys.get('alice')?.privateKey.type).toBe('private');
    expect(setDoc).toHaveBeenCalledTimes(1);

    const [ref, data, options] = setDoc.mock.calls[0];
    expect(ref).toBe('users/alice');
    // merge, and only this one field: an unmerged write wipes the profile.
    expect(options).toEqual({ merge: true });
    expect(Object.keys(data)).toEqual(['publicKey']);
    expect(data.publicKey).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(data.publicKey).not.toHaveProperty('d');
  });

  it('creates a key for an account whose user doc does not exist yet', async () => {
    getDoc.mockResolvedValue(userDoc());

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result.status).toBe('created');
  });

  it('removes the new local key when publishing it is rejected', async () => {
    getDoc.mockResolvedValue(userDoc({ name: 'Alice' }));
    setDoc.mockRejectedValue(new Error('permission-denied'));

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result.status).toBe('error');
    expect(localKeys.has('alice')).toBe(false);
  });

  it('reports an error, and generates nothing, when Firestore cannot be read', async () => {
    getDoc.mockRejectedValue(new Error('unavailable'));

    const result = await getOrCreateIdentityKeyPair('alice');

    expect(result.status).toBe('error');
    expect(setDoc).not.toHaveBeenCalled();
    expect(localKeys.has('alice')).toBe(false);
  });
});

describe('privateKeyMatchesPublicKey', () => {
  it('accepts the two halves of one pair', async () => {
    const pair = await generateIdentity();

    expect(await privateKeyMatchesPublicKey(pair.privateKey, pair.publicKey)).toBe(true);
  });

  it('rejects a private key from a different pair', async () => {
    const pair = await generateIdentity();
    const other = await generateIdentity();

    expect(await privateKeyMatchesPublicKey(other.privateKey, pair.publicKey)).toBe(false);
  });

  it('rejects a private key whose JWK was given the public point of another pair', async () => {
    const pair = await generateIdentity();
    const other = await generateIdentity();
    const forged = {
      ...(await crypto.subtle.exportKey('jwk', other.privateKey)),
      ...pickPoint(await crypto.subtle.exportKey('jwk', pair.publicKey)),
    };

    // Some engines refuse to import an inconsistent key at all, which is
    // just as good. One that imports it must not see it as a match.
    const imported = await crypto.subtle
      .importKey('jwk', forged, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
      .catch(() => null);
    const accepted = imported ? await privateKeyMatchesPublicKey(imported, pair.publicKey) : false;

    expect(accepted).toBe(false);
  });
});

function pickPoint(jwk: JsonWebKey) {
  return { x: jwk.x, y: jwk.y };
}
