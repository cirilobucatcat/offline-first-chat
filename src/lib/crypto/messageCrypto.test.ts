import { describe, expect, it } from 'vitest';
import {
  MESSAGE_ALGO,
  decryptMessageText,
  deriveConversationKey,
  encryptMessageText,
} from './messageCrypto';

function generateIdentity() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

const CONVERSATION = 'alice_bob';
const FROM_ALICE = `${CONVERSATION}:alice`;

describe('direct message encryption', () => {
  it('lets each side decrypt what the other encrypted', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const aliceKey = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);
    const bobKey = await deriveConversationKey(bob.privateKey, alice.publicKey, CONVERSATION);

    const sent = await encryptMessageText(aliceKey, 'see you at 6', FROM_ALICE);

    expect(await decryptMessageText(bobKey, sent.ciphertext, sent.iv, FROM_ALICE)).toBe('see you at 6');
  });

  it('tags messages with the algorithm name stored in existing messages', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const key = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);

    const sent = await encryptMessageText(key, 'hi', FROM_ALICE);

    // Renaming this breaks every message already in Firestore.
    expect(sent.algo).toBe('p256-ecdh-aes256gcm-v1');
    expect(MESSAGE_ALGO).toBe('p256-ecdh-aes256gcm-v1');
  });

  it('uses a fresh IV for every message', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const key = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);

    const first = await encryptMessageText(key, 'same text', FROM_ALICE);
    const second = await encryptMessageText(key, 'same text', FROM_ALICE);

    expect(first.iv.toUint8Array()).toHaveLength(12);
    expect(first.iv.isEqual(second.iv)).toBe(false);
    expect(first.ciphertext.isEqual(second.ciphertext)).toBe(false);
  });

  it('returns null when the sender in the associated data is wrong', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const key = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);

    const sent = await encryptMessageText(key, 'hi', FROM_ALICE);

    expect(await decryptMessageText(key, sent.ciphertext, sent.iv, `${CONVERSATION}:bob`)).toBeNull();
  });

  it('returns null under the key for another conversation', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const key = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);
    const otherKey = await deriveConversationKey(alice.privateKey, bob.publicKey, 'another_chat');

    const sent = await encryptMessageText(key, 'hi', FROM_ALICE);

    expect(await decryptMessageText(otherKey, sent.ciphertext, sent.iv, FROM_ALICE)).toBeNull();
  });

  it('returns null for a third person who has neither private key', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const eve = await generateIdentity();
    const key = await deriveConversationKey(alice.privateKey, bob.publicKey, CONVERSATION);
    const eveKey = await deriveConversationKey(eve.privateKey, bob.publicKey, CONVERSATION);

    const sent = await encryptMessageText(key, 'hi', FROM_ALICE);

    expect(await decryptMessageText(eveKey, sent.ciphertext, sent.iv, FROM_ALICE)).toBeNull();
  });
});
