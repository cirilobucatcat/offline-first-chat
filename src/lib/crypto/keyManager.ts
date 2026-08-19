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
 * recovery," never "make this account a new identity."
 *
 * Recovery (restoring the existing private key onto a new device) isn't
 * implemented yet — see keyManager's `needs-recovery` result and
 * IdentityKeyGate.tsx for how that state is surfaced instead of papered over.
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
const CURVE = 'P-256' as const;

export type IdentityKeyResult =
    | { status: 'created'; keyPair: CryptoKeyPair }
    | { status: 'existing'; keyPair: CryptoKeyPair }
    | { status: 'needs-recovery' }
    | { status: 'error'; error: unknown };

async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
    // extractable: false applies to the PRIVATE key only. Per the Web Crypto
    // spec, generateKey always marks the returned PUBLIC key as extractable
    // regardless of this flag — so we can still export/publish it below,
    // while the private key can never leave the browser as raw bytes.
    return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, false, [
        'deriveKey',
        'deriveBits',
    ]) as Promise<CryptoKeyPair>;
}

async function publishPublicKey(uid: string, publicKey: CryptoKey): Promise<void> {
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
export async function getOrCreateIdentityKeyPair(uid: string): Promise<IdentityKeyResult> {
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
            return { status: 'needs-recovery' };
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

/** Imports another user's published public key (their Firestore JWK) for later ECDH derivation. */
export async function importPeerPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: CURVE }, true, []);
}

/** Wipes this device's local private key. Call from sign-out-everywhere / account deletion flows. */
export async function forgetIdentityKeyPair(uid: string): Promise<void> {
    await deleteStoredKeyPair(uid);
}