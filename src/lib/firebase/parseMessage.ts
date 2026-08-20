/**
 * Interprets a raw Firestore message doc into a typed, displayable shape.
 *
 * Three doc shapes exist in the same messages subcollection, and this is
 * the one place that tells them apart:
 *   - Legacy messages, sent before encryption existed at all: no
 *     `encrypted` field, just `{ senderId, text, createdAt }`.
 *   - New group messages: `encrypted: false` explicitly, still `text`
 *     (groups aren't encrypted yet — see sendMessage.ts).
 *   - New direct messages: `encrypted: true`, `ciphertext` + `iv` instead
 *     of `text`.
 *
 * Legacy and "explicitly false" are treated identically — both render as
 * plaintext. Nothing is rewritten in Firestore to get this; it's a
 * read-time interpretation only, so there's no backfill/migration step to
 * run. A legacy message being absent the `encrypted` field isn't a bug to
 * fix — it's an accurate record that the message predates encryption and
 * was, in fact, always plaintext.
 */

import type { DocumentData, Timestamp, Bytes } from 'firebase/firestore';

export interface DisplayableEncryptedMessage {
    id: string;
    senderId: string;
    encrypted: true;
    ciphertext: Bytes;
    iv: Bytes;
    // null while this device's own optimistic write is pending server ack —
    // serverTimestamp() reads back as null locally until then.
    createdAt: Timestamp | null;
}

export interface DisplayablePlaintextMessage {
    id: string;
    senderId: string;
    encrypted: false;
    text: string;
    createdAt: Timestamp | null;
}

export type DisplayableMessage = DisplayableEncryptedMessage | DisplayablePlaintextMessage;

export function parseMessage(id: string, data: DocumentData): DisplayableMessage {
    if (data.encrypted === true) {
        return {
            id,
            senderId: data.senderId,
            encrypted: true,
            ciphertext: data.ciphertext,
            iv: data.iv,
            createdAt: data.createdAt,
        };
    }

    // encrypted === false, or the field is missing entirely (legacy) — both
    // land here. `??` covers the edge case of a doc with neither field set.
    return {
        id,
        senderId: data.senderId,
        encrypted: false,
        text: data.text ?? '',
        createdAt: data.createdAt,
    };
}