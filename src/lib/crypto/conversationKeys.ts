/**
 * Fetches peer public keys, derives per-conversation AES keys, and caches
 * both in memory for the session (derivation is cheap, but there's no
 * reason to repeat a Firestore read or an ECDH+HKDF derive on every message).
 */

import { doc, getDoc } from 'firebase/firestore';
import type { Bytes } from 'firebase/firestore';
import { importPeerPublicKey } from './keyManager';
import { deriveConversationKey, decryptMessageText } from './messageCrypto';
import { db } from '../firebase';

const conversationKeyCache = new Map<string, CryptoKey>();
const peerPublicKeyCache = new Map<string, CryptoKey>();

async function fetchPeerPublicKey(peerUid: string): Promise<CryptoKey | null> {
    const cached = peerPublicKeyCache.get(peerUid);
    if (cached) return cached;

    const snap = await getDoc(doc(db, 'users', peerUid));
    const jwk = snap.exists() ? (snap.data().publicKey as JsonWebKey | undefined) : undefined;
    if (!jwk) return null; // peer's device hasn't completed identity key setup yet

    const publicKey = await importPeerPublicKey(jwk);
    peerPublicKeyCache.set(peerUid, publicKey);
    return publicKey;
}

/**
 * Returns the AES-256-GCM key for a direct conversation, deriving and
 * caching it on first use. Returns null if the peer hasn't published a
 * public key yet — callers should treat that as "can't send/read encrypted
 * messages here yet," not fall back to plaintext.
 */
export async function getConversationKey(
    conversationId: string,
    myPrivateKey: CryptoKey,
    peerUid: string
): Promise<CryptoKey | null> {
    const cached = conversationKeyCache.get(conversationId);
    if (cached) return cached;

    const peerPublicKey = await fetchPeerPublicKey(peerUid);
    if (!peerPublicKey) return null;

    const key = await deriveConversationKey(myPrivateKey, peerPublicKey, conversationId);
    conversationKeyCache.set(conversationId, key);
    return key;
}

/** For a direct (2-participant) conversation, returns the other participant's uid. */
export function getDirectConversationPeerUid(
    participants: string[],
    myUid: string
): string | null {
    return participants.find((uid) => uid !== myUid) ?? null;
}

/**
 * Decrypts one message for rendering. Always resolves to a displayable
 * string — falls back to a clear placeholder rather than throwing, so one
 * bad message can't crash the message list.
 */
export async function decryptMessageForDisplay(
    message: { senderId: string; ciphertext: Bytes; iv: Bytes },
    conversationId: string,
    myPrivateKey: CryptoKey,
    peerUid: string
): Promise<string> {
    const key = await getConversationKey(conversationId, myPrivateKey, peerUid);
    if (!key) return '🔒 Unable to decrypt — sender key unavailable';

    const associatedData = `${conversationId}:${message.senderId}`;
    const plaintext = await decryptMessageText(key, message.ciphertext, message.iv, associatedData);
    return plaintext ?? '🔒 Unable to decrypt this message';
}

/** Clears cached keys — call on sign-out so a different account signing in on the same tab doesn't inherit them. */
export function clearConversationKeyCache(): void {
    conversationKeyCache.clear();
    peerPublicKeyCache.clear();
}