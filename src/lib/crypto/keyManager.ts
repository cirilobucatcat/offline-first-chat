/**
 * Identity key lifecycle for WeakChat's end-to-end encryption.
 *
 * GUARD ORDER (do not reorder without re-reading the note below):
 *   1. IndexedDB  — does THIS DEVICE already have the private key?
 *   2. Firestore  — does this ACCOUNT already have a public key,
 *                   published from some other device?
 *   3. Generate   — only if neither of the above is true.
 *
 * Why step 2 exists: if we generated a fresh key the moment IndexedDB is
 * empty, then every new-device login would silently overwrite
 * users/{uid}.publicKey — permanently breaking decryption of every message
 * ever encrypted against the old key, on every device. An existing
 * Firestore key with no local private key means "this device needs
 * linking," never "make this account a new identity."
 *
 * RECOVERY: 'needs-link' is handled by deviceLink.ts + useIdentityKeys — an
 * already-signed-in device hands this device a copy of the identity
 * private key over a one-time encrypted handshake. See deviceLink.ts for
 * the protocol. (A no-other-device-available fallback — PIN or recovery
 * phrase — is still separate and not yet built; it only matters for the
 * case where zero other devices exist to link from.)
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  deleteStoredKeyPair,
  getStoredKeyPair,
  saveKeyPair,
  type StoredIdentityKeyPair,
} from './keyStore';
import { db } from '../firebase';

// P-256 (NIST) rather than X25519: X25519 only finished landing across
// Chrome, Firefox and Safari in 2025, so P-256 is still the safer default
// for a cross-platform PWA — it's had universal Web Crypto support for
// years. Worth revisiting once X25519 support is unambiguously ubiquitous.
//
// Exported so deviceLink.ts's ephemeral handshake keys use the same curve
// rather than a second hardcoded literal that could drift out of sync.
export const CURVE = 'P-256' as const;

export type IdentityKeyResult =
  | { status: 'created'; keyPair: CryptoKeyPair }
  | { status: 'existing'; keyPair: CryptoKeyPair }
  | { status: 'needs-link'; publicKeyJwk: JsonWebKey }
  | { status: 'error'; error: unknown };

async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  // extractable: true on the private key now (was false). This is a
  // deliberate tradeoff for device linking: WebCrypto ties wrapKey's
  // permission to the same extractable flag as exportKey, so a
  // non-extractable key literally cannot be wrapped, backed up, or moved
  // to a second device — there's no way around that while keeping it
  // non-extractable. The cost: code with a live reference to this key
  // (including an XSS payload) can now call exportKey and read out raw
  // bytes, not just use the key via deriveKey/deriveBits. See keyStore.ts
  // for the fuller note on what this does and doesn't change.
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

async function publishPublicKey(
  uid: string,
  publicKey: CryptoKey,
): Promise<void> {
  const jwk = await crypto.subtle.exportKey('jwk', publicKey);
  // merge: true, and this ONLY ever sets `publicKey`. Do not duplicate
  // ensureUserProfile's write here — see memory note on the single write
  // path for users/{uid} (a second unmerged setDoc wiped nameLower/initials
  // once before).
  await setDoc(doc(db, 'users', uid), { publicKey: jwk }, { merge: true });
}

/**
 * Ensures the signed-in account has an identity key pair, following the
 * guard order documented above. Call this once per session, right after
 * auth resolves (after your existing ensureUserProfile call).
 */
export async function getOrCreateIdentityKeyPair(
  uid: string,
): Promise<IdentityKeyResult> {
  try {
    // 1. This device.
    const stored = await getStoredKeyPair(uid);
    if (stored) {
      return {
        status: 'existing',
        keyPair: { publicKey: stored.publicKey, privateKey: stored.privateKey },
      };
    }

    // 2. This account, on any device.
    const userSnap = await getDoc(doc(db, 'users', uid));
    const existingPublicKey = userSnap.exists()
      ? (userSnap.data().publicKey as JsonWebKey | undefined)
      : undefined;

    if (existingPublicKey) {
      // Hand the JWK back to the caller rather than making it re-fetch —
      // useIdentityKeys needs it to reconstruct the full CryptoKeyPair
      // once the linking handshake delivers the private half.
      return { status: 'needs-link', publicKeyJwk: existingPublicKey };
    }

    // 3. Genuinely new identity.
    const keyPair = await generateIdentityKeyPair();
    const entry: StoredIdentityKeyPair = {
      uid,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      createdAt: Date.now(),
    };
    await saveKeyPair(entry);
    await publishPublicKey(uid, keyPair.publicKey);

    return { status: 'created', keyPair };
  } catch (error) {
    return { status: 'error', error };
  }
}

/**
 * Imports a published public key (JWK) for ECDH derivation. Used both for
 * peers' public keys (conversationKeys.ts) and, during device linking, to
 * reconstruct this account's own public key locally once a new device has
 * received the private half — it's the same operation either way, a
 * public key import doesn't care whose key it is.
 */
export async function importPeerPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: CURVE },
    true,
    [],
  );
}

/** Wipes this device's local private key. Call from sign-out-everywhere / account deletion flows. */
export async function forgetIdentityKeyPair(uid: string): Promise<void> {
  await deleteStoredKeyPair(uid);
}