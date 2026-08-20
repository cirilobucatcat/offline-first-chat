/**
 * Message-level crypto primitives: deriving a per-conversation AES-256-GCM
 * key from two identity keys, and encrypting/decrypting message text with it.
 *
 * Scope note: this derives ONE shared key per pair of accounts, using their
 * static per-account identity keys (see keyManager.ts). That means:
 *   - No handshake or extra Firestore round-trip is needed — either side
 *     can compute the same key independently from data they already have.
 *   - No forward secrecy — a leaked identity private key exposes every past
 *     message, since the key isn't rotated per session or per message.
 *     Fixing that means moving to ephemeral/ratcheted keys, which is a
 *     bigger redesign than this pass and isn't attempted here.
 *   - It only covers pairs (direct conversations). Groups have no single
 *     shared secret without per-device fan-out encryption, which is the
 *     already-planned v2 — group messages are left out of scope here on
 *     purpose rather than approximated with something weaker.
 */

import { Bytes } from 'firebase/firestore';

export const MESSAGE_ALGO = 'p256-ecdh-aes256gcm-v1';

/**
 * Firestore's Bytes.toUint8Array() is typed as a bare `Uint8Array`, which
 * under TS 5.7+'s generic typed arrays resolves to the wider
 * `Uint8Array<ArrayBufferLike>` — even though at runtime it's always backed
 * by a plain ArrayBuffer, never a SharedArrayBuffer. Web Crypto's
 * `BufferSource` correctly requires the narrower `Uint8Array<ArrayBuffer>`.
 * `new Uint8Array(source)` always allocates a fresh, non-shared buffer, so
 * this closes that gap with a cheap copy rather than an `as` cast — an `as`
 * would silently accept an actual SharedArrayBuffer-backed view too, which
 * this function won't.
 */
function asBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes);
}

/**
 * Derives a stable AES-256-GCM key for one conversation from this device's
 * ECDH private key and the peer's public key, via HKDF-SHA256. Both sides
 * derive the identical key independently — ECDH(myPriv, peerPub) ==
 * ECDH(peerPriv, myPub) — so nothing about the key itself is ever sent
 * anywhere.
 */
export async function deriveConversationKey(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey,
  conversationId: string
): Promise<CryptoKey> {
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    256
  );

  const hkdfInput = await crypto.subtle.importKey('raw', sharedSecretBits, 'HKDF', false, [
    'deriveKey',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      // Not secret — HKDF's salt only needs to be fixed and shared, which a
      // constant satisfies. `info` binds the key to this specific
      // conversation so the same two accounts derive distinct keys if they
      // ever have more than one conversation between them.
      salt: new TextEncoder().encode('weakchat-v1'),
      info: new TextEncoder().encode(`conversation:${conversationId}`),
    },
    hkdfInput,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: Bytes;
  iv: Bytes;
  algo: string;
}

/**
 * Encrypts message text with a fresh random 96-bit IV (required — never
 * reuse an IV under the same AES-GCM key). `associatedData` is authenticated
 * but not hidden: it binds the ciphertext to the context it was created in
 * (conversation + sender) so it can't be replayed elsewhere, even though
 * nobody without the key could forge a new ciphertext regardless.
 */
export async function encryptMessageText(
  key: CryptoKey,
  plaintext: string,
  associatedData: string
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(associatedData) },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: Bytes.fromUint8Array(new Uint8Array(ciphertextBuffer)),
    iv: Bytes.fromUint8Array(iv),
    algo: MESSAGE_ALGO,
  };
}

/**
 * Decrypts message text. Never throws — a wrong key, tampered ciphertext,
 * or mismatched associatedData all land as `null`, and the caller decides
 * how to render that (see decryptMessageForDisplay in conversationKeys.ts).
 */
export async function decryptMessageText(
  key: CryptoKey,
  ciphertext: Bytes,
  iv: Bytes,
  associatedData: string
): Promise<string | null> {
  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: asBufferSource(iv.toUint8Array()),
        additionalData: new TextEncoder().encode(associatedData),
      },
      key,
      asBufferSource(ciphertext.toUint8Array())
    );
    return new TextDecoder().decode(plaintextBuffer);
  } catch {
    return null;
  }
}