/**
 * Device linking: lets an already-signed-in "primary" device hand this
 * account's identity private key to a new device, so the new device can
 * decrypt existing conversations instead of sitting in keyManager's
 * 'needs-link' state forever.
 *
 * WHY A HANDSHAKE, NOT JUST A FIRESTORE WRITE: the identity private key
 * must never be written to Firestore in a form anyone with database read
 * access could recover — including us, or a misconfigured rule. So the two
 * devices first agree on a one-time secret that only ever exists in their
 * own browser memory (an ephemeral ECDH handshake), and only the *wrapped*
 * (encrypted) key ever touches Firestore. Firestore's job here is purely to
 * relay bytes between two browsers that can't otherwise talk to each other
 * directly — the same real-time layer already used for messages, no new
 * infrastructure.
 *
 * SESSION ID == CODE: the human-facing "code" the user types is just the
 * Firestore document ID. It isn't a secret on its own — Firestore rules
 * already restrict this whole subcollection to the signed-in account's own
 * uid, so nobody outside the account could read a session doc even if they
 * guessed the code. Its only job is letting the primary device find which
 * pending session the new device means, in case there's more than one
 * (e.g. an abandoned earlier attempt).
 *
 * LIFECYCLE:
 *   1. New device:     createLinkSession()    → writes 'pending', shows code
 *   2. Primary device: findLinkSession(code)  → reads it, checks it's live
 *   3. Primary device: completeLinkSession()  → wraps the key, writes 'ready'
 *   4. New device:     (via watchLinkSession) → acceptLinkSession() unwraps it
 *   5. New device:      deleteLinkSession()   → cleans up early; a Firestore
 *                                                TTL policy on `expiresAt`
 *                                                (configured in the Firebase
 *                                                console/CLI, not in rules)
 *                                                is the backstop for
 *                                                abandoned sessions.
 */

import {
  Bytes,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CURVE } from './keyManager';
import { asBufferSource } from './messageCrypto';

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes — short-lived on purpose
// Crockford-style alphabet: no 0/O or 1/I/L, so a misread character can't
// silently resolve to a different valid code.
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

function generateSessionCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    '',
  );
}

function linkSessionRef(uid: string, sessionId: string) {
  return doc(db, 'users', uid, 'linkSessions', sessionId);
}

/** A one-time keypair scoped to a single handshake — never the identity key itself. */
async function generateEphemeralKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, true, [
    'deriveKey',
    'deriveBits',
  ]) as Promise<CryptoKeyPair>;
}

async function importEphemeralPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: CURVE },
    true,
    [],
  );
}

/**
 * Derives the AES-256-GCM key used to wrap/unwrap the identity private key
 * for this one handshake. Mirrors messageCrypto.ts's ECDH → HKDF pattern,
 * with a distinct salt and an `info` bound to this sessionId, so this key
 * can never collide with (or be confused for) a conversation key.
 */
async function deriveHandshakeKey(
  myEphemeralPrivateKey: CryptoKey,
  theirEphemeralPublicKey: CryptoKey,
  sessionId: string,
): Promise<CryptoKey> {
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirEphemeralPublicKey },
    myEphemeralPrivateKey,
    256,
  );

  const hkdfInput = await crypto.subtle.importKey(
    'raw',
    sharedSecretBits,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('weakchat-device-link-v1'),
      info: new TextEncoder().encode(`link:${sessionId}`),
    },
    hkdfInput,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

export interface LinkSession {
  sessionId: string;
  code: string;
  ephemeralKeyPair: CryptoKeyPair;
}

export interface LinkSessionUpdate {
  status: 'pending' | 'ready';
  newDeviceEphemeralPublicKey: JsonWebKey;
  primaryDeviceEphemeralPublicKey?: JsonWebKey;
  wrappedPrivateKey?: Bytes;
  wrappedPrivateKeyIv?: Bytes;
  expiresAt: Timestamp;
}

/**
 * NEW DEVICE. Starts a linking session: generates this device's ephemeral
 * keypair, publishes its public half, and returns the code to show the
 * user. Hang on to `ephemeralKeyPair` — its private key is needed again in
 * acceptLinkSession() once the primary device responds.
 */
export async function createLinkSession(uid: string): Promise<LinkSession> {
  const ephemeralKeyPair = await generateEphemeralKeyPair();
  const sessionId = generateSessionCode();
  const publicJwk = await crypto.subtle.exportKey(
    'jwk',
    ephemeralKeyPair.publicKey,
  );
  const now = Date.now();

  await setDoc(linkSessionRef(uid, sessionId), {
    status: 'pending',
    newDeviceEphemeralPublicKey: publicJwk,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + SESSION_TTL_MS),
  });

  return { sessionId, code: sessionId, ephemeralKeyPair };
}

/**
 * NEW DEVICE. Subscribes to the session doc and calls `onUpdate` on every
 * change until the returned function is called to unsubscribe. Fires with
 * `null` if the doc is deleted (expired or cancelled) — callers should
 * ignore that rather than treat it as an error unless they're still
 * actively waiting.
 */
export function watchLinkSession(
  uid: string,
  sessionId: string,
  onUpdate: (update: LinkSessionUpdate | null) => void,
): () => void {
  return onSnapshot(linkSessionRef(uid, sessionId), (snap) => {
    onUpdate(snap.exists() ? (snap.data() as LinkSessionUpdate) : null);
  });
}

/**
 * PRIMARY DEVICE. Looks up a session by the code the user typed. Returns
 * null if it doesn't exist, already completed, or expired — callers should
 * show a single generic "that code isn't valid" message rather than
 * distinguishing why, so the code field can't be used to probe for which
 * case applies.
 */
export async function findLinkSession(
  uid: string,
  code: string,
): Promise<(LinkSessionUpdate & { sessionId: string }) | null> {
  const snap = await getDoc(linkSessionRef(uid, code));
  if (!snap.exists()) return null;

  const data = snap.data() as LinkSessionUpdate;
  if (data.status !== 'pending') return null;
  if (data.expiresAt.toMillis() < Date.now()) return null;

  return { ...data, sessionId: code };
}

/**
 * PRIMARY DEVICE. Completes the handshake: derives the shared secret,
 * wraps the identity private key under it, and writes the wrapped key back
 * to the session doc for the new device to pick up. `identityPrivateKey`
 * is this device's own already-unlocked key — from useMyIdentityKey(), not
 * re-fetched here.
 */
export async function completeLinkSession(
  uid: string,
  sessionId: string,
  newDeviceEphemeralPublicKeyJwk: JsonWebKey,
  identityPrivateKey: CryptoKey,
): Promise<void> {
  const theirEphemeralPublicKey = await importEphemeralPublicKey(
    newDeviceEphemeralPublicKeyJwk,
  );
  const myEphemeralKeyPair = await generateEphemeralKeyPair();
  const handshakeKey = await deriveHandshakeKey(
    myEphemeralKeyPair.privateKey,
    theirEphemeralPublicKey,
    sessionId,
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedBuffer = await crypto.subtle.wrapKey(
    'jwk',
    identityPrivateKey,
    handshakeKey,
    {
      name: 'AES-GCM',
      iv,
    },
  );
  const myEphemeralPublicJwk = await crypto.subtle.exportKey(
    'jwk',
    myEphemeralKeyPair.publicKey,
  );

  await setDoc(
    linkSessionRef(uid, sessionId),
    {
      status: 'ready',
      primaryDeviceEphemeralPublicKey: myEphemeralPublicJwk,
      wrappedPrivateKey: Bytes.fromUint8Array(new Uint8Array(wrappedBuffer)),
      wrappedPrivateKeyIv: Bytes.fromUint8Array(iv),
    },
    { merge: true },
  );
}

/**
 * NEW DEVICE. Call once `watchLinkSession` reports status 'ready'. Derives
 * the same shared secret independently from the other side and unwraps the
 * identity private key. The returned key comes out of unwrapKey directly —
 * its raw bytes never pass through JS at any point in this process.
 */
export async function acceptLinkSession(
  ephemeralKeyPair: CryptoKeyPair,
  sessionId: string,
  update: LinkSessionUpdate,
): Promise<CryptoKey> {
  if (
    !update.primaryDeviceEphemeralPublicKey ||
    !update.wrappedPrivateKey ||
    !update.wrappedPrivateKeyIv
  ) {
    throw new Error('acceptLinkSession called before the session was ready');
  }

  const theirEphemeralPublicKey = await importEphemeralPublicKey(
    update.primaryDeviceEphemeralPublicKey,
  );
  const handshakeKey = await deriveHandshakeKey(
    ephemeralKeyPair.privateKey,
    theirEphemeralPublicKey,
    sessionId,
  );

  return crypto.subtle.unwrapKey(
    'jwk',
    asBufferSource(update.wrappedPrivateKey.toUint8Array()),
    handshakeKey,
    {
      name: 'AES-GCM',
      iv: asBufferSource(update.wrappedPrivateKeyIv.toUint8Array()),
    },
    { name: 'ECDH', namedCurve: CURVE },
    true, // stays extractable — this device may itself link a third device later
    ['deriveKey', 'deriveBits'],
  );
}

/** Either device, once linking succeeds or is cancelled. */
export async function deleteLinkSession(
  uid: string,
  sessionId: string,
): Promise<void> {
  await deleteDoc(linkSessionRef(uid, sessionId));
}
