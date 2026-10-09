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
 * THE CODE IS THE SECRET: the ECDH handshake alone only protects against
 * someone *reading* the session doc. Anyone who can *write* it — a stolen
 * sign-in is enough, the identity key is not needed — could swap in their
 * own ephemeral public key and have the primary device wrap the identity
 * key for them. The code the user carries from one screen to the other is
 * what rules that out, so it is never written to Firestore:
 *   - the session's document ID is derived from the code, so the primary
 *     device can find the session without the ID giving the code away;
 *   - a second value derived from the code is mixed into the wrapping key,
 *     so a device that never saw the code can't unwrap what comes back,
 *     whichever ephemeral key the session doc held.
 * Both are derived through PBKDF2, and the code is 80 bits, so neither the
 * document ID nor a captured wrapped key is a practical way to guess it.
 * Don't shorten the code and don't store it. What this can't stop is the
 * user typing in a code from a device that isn't theirs.
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
// Crockford-style alphabet: no 0/O or 1/I, so a misread character can't
// silently resolve to a different valid code.
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
// 16 characters of a 32-symbol alphabet is 80 bits. See THE CODE IS THE
// SECRET above before changing this.
export const LINK_CODE_LENGTH = 16;
const CODE_GROUP_LENGTH = 4;
const CODE_STRETCH_ITERATIONS = 600_000;
const LINK_SALT = 'weakchat-device-link-v1';

function generateLinkCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LINK_CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    '',
  );
}

/**
 * The one form of a code that goes into the key derivation: upper case,
 * with the spaces or hyphens it was shown or typed with removed.
 */
export function normalizeLinkCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/** A normalized code in groups of four, for showing it and for typing it. */
export function formatLinkCode(code: string): string {
  return (
    code.match(new RegExp(`.{1,${CODE_GROUP_LENGTH}}`, 'g'))?.join(' ') ?? ''
  );
}

function linkSessionRef(uid: string, sessionId: string) {
  return doc(db, 'users', uid, 'linkSessions', sessionId);
}

/**
 * Derives everything the two devices need from the code: where the session
 * lives in Firestore, and the secret that goes into the wrapping key. The
 * code is stretched with PBKDF2 first, because the session ID is visible to
 * anyone who can read the account's data and would otherwise be a cheap way
 * to test guesses. Salted with the uid so the work can't be shared between
 * accounts.
 */
async function deriveFromCode(
  uid: string,
  code: string,
): Promise<{ sessionId: string; codeSecret: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const codeKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizeLinkCode(code)),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const stretched = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(`${LINK_SALT}:${uid}`),
      iterations: CODE_STRETCH_ITERATIONS,
    },
    codeKey,
    256,
  );

  const expandKey = await crypto.subtle.importKey(
    'raw',
    stretched,
    'HKDF',
    false,
    ['deriveBits'],
  );
  const expand = (label: string, bits: number) =>
    crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode(LINK_SALT),
        info: encoder.encode(label),
      },
      expandKey,
      bits,
    );
  const [sessionIdBits, codeSecret] = await Promise.all([
    expand('link-code:session-id', 128),
    expand('link-code:secret', 256),
  ]);

  const sessionId = Array.from(new Uint8Array(sessionIdBits), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  return { sessionId, codeSecret };
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
 *
 * The input is the ECDH secret followed by the code secret, both 32 bytes.
 * The ECDH half keeps out anyone who only reads the session doc; the code
 * half keeps out anyone who put their own ephemeral key into it.
 */
async function deriveHandshakeKey(
  myEphemeralPrivateKey: CryptoKey,
  theirEphemeralPublicKey: CryptoKey,
  codeSecret: ArrayBuffer,
  sessionId: string,
): Promise<CryptoKey> {
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirEphemeralPublicKey },
    myEphemeralPrivateKey,
    256,
  );

  const keyMaterial = new Uint8Array(
    sharedSecretBits.byteLength + codeSecret.byteLength,
  );
  keyMaterial.set(new Uint8Array(sharedSecretBits), 0);
  keyMaterial.set(new Uint8Array(codeSecret), sharedSecretBits.byteLength);

  const hkdfInput = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(LINK_SALT),
      info: new TextEncoder().encode(`link:${sessionId}`),
    },
    hkdfInput,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

export interface LinkSession {
  /** The Firestore document ID. Derived from the code, but doesn't reveal it. */
  sessionId: string;
  /** Shown on this device and typed on the other. Never written anywhere. */
  code: string;
  ephemeralKeyPair: CryptoKeyPair;
  /** Derived from the code; goes into the wrapping key. Never written anywhere. */
  codeSecret: ArrayBuffer;
  /** Milliseconds since the epoch. The primary device rejects the code after this. */
  expiresAt: number;
}

export interface LinkSessionUpdate {
  status: 'pending' | 'ready';
  newDeviceEphemeralPublicKey: JsonWebKey;
  primaryDeviceEphemeralPublicKey?: JsonWebKey;
  wrappedPrivateKey?: Bytes;
  wrappedPrivateKeyIv?: Bytes;
  expiresAt: Timestamp;
}

/** A live session as the primary device sees it, once the user has typed its code. */
export interface PendingLinkSession extends LinkSessionUpdate {
  sessionId: string;
  codeSecret: ArrayBuffer;
}

/**
 * NEW DEVICE. Starts a linking session: generates this device's ephemeral
 * keypair, publishes its public half, and returns the code to show the
 * user. Hang on to the returned session — its ephemeral private key and
 * code secret are needed again in acceptLinkSession() once the primary
 * device responds.
 */
export async function createLinkSession(uid: string): Promise<LinkSession> {
  const ephemeralKeyPair = await generateEphemeralKeyPair();
  const code = generateLinkCode();
  const { sessionId, codeSecret } = await deriveFromCode(uid, code);
  const publicJwk = await crypto.subtle.exportKey(
    'jwk',
    ephemeralKeyPair.publicKey,
  );
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await setDoc(linkSessionRef(uid, sessionId), {
    status: 'pending',
    newDeviceEphemeralPublicKey: publicJwk,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAt),
  });

  return { sessionId, code, ephemeralKeyPair, codeSecret, expiresAt };
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
): Promise<PendingLinkSession | null> {
  if (normalizeLinkCode(code).length !== LINK_CODE_LENGTH) return null;

  const { sessionId, codeSecret } = await deriveFromCode(uid, code);
  const snap = await getDoc(linkSessionRef(uid, sessionId));
  if (!snap.exists()) return null;

  const data = snap.data() as LinkSessionUpdate;
  if (data.status !== 'pending') return null;
  if (data.expiresAt.toMillis() < Date.now()) return null;

  return { ...data, sessionId, codeSecret };
}

/**
 * PRIMARY DEVICE. Completes the handshake: derives the shared secret,
 * wraps the identity private key under it, and writes the wrapped key back
 * to the session doc for the new device to pick up. `session` comes from
 * findLinkSession(), so its code secret is the one the user typed in.
 * `identityPrivateKey` is this device's own already-unlocked key — from
 * useMyIdentityKey(), not re-fetched here.
 */
export async function completeLinkSession(
  uid: string,
  session: PendingLinkSession,
  identityPrivateKey: CryptoKey,
): Promise<void> {
  const theirEphemeralPublicKey = await importEphemeralPublicKey(
    session.newDeviceEphemeralPublicKey,
  );
  const myEphemeralKeyPair = await generateEphemeralKeyPair();
  const handshakeKey = await deriveHandshakeKey(
    myEphemeralKeyPair.privateKey,
    theirEphemeralPublicKey,
    session.codeSecret,
    session.sessionId,
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
    linkSessionRef(uid, session.sessionId),
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
  session: LinkSession,
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
    session.ephemeralKeyPair.privateKey,
    theirEphemeralPublicKey,
    session.codeSecret,
    session.sessionId,
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
