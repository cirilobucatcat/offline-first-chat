import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decryptMessageForDisplay } from '@/lib/crypto/conversationKeys';
import { parseMessage, type DisplayableMessage } from '@/lib/firebase/parseMessage';
import { useMyIdentityKey } from '@/context/IdentityContext';

export type DisplayMessage = {
  /** Always safe to render directly — decrypted text, plaintext text, or a
   *  placeholder while decryption is still in flight. Never `text` — that
   *  field only exists on the plaintext variant of DisplayableMessage. */
  displayText: string;
} & DisplayableMessage

/**
 * `peerUid` is the other participant in a DIRECT conversation — pass null
 * for groups. Groups never have encrypted messages (see chat.ts), so
 * nothing here needs their peer list; a null peerUid just means the
 * decrypt effect below has nothing to do, which is correct for them.
 */
export function useMessages(conversationId: string | null, peerUid: string | null) {
  const { privateKey } = useMyIdentityKey();
  const [rawMessages, setRawMessages] = useState<DisplayableMessage[]>([]);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  // Tracks which message ids we've already kicked off decryption for.
  // Deliberately NOT the same as `decrypted` — a ref lets the guard below
  // stay out of the effect's dependency array, so finishing one message's
  // decryption doesn't re-run the effect over every message again.
  const decryptingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDecrypted({});
    decryptingRef.current = new Set();

    if (!conversationId) {
      setRawMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRawMessages(snapshot.docs.map((d) => parseMessage(d.id, d.data() as DocumentData)));
      setLoading(false);
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !peerUid) return;

    rawMessages.forEach((msg) => {
      if (msg.encrypted !== true || decryptingRef.current.has(msg.id)) return;
      decryptingRef.current.add(msg.id);

      decryptMessageForDisplay(msg, conversationId, privateKey, peerUid).then((text) => {
        setDecrypted((prev) => ({ ...prev, [msg.id]: text }));
      });
    });
  }, [rawMessages, conversationId, peerUid, privateKey]);

  const messages: DisplayMessage[] = rawMessages.map((msg) => ({
    ...msg,
    displayText: msg.encrypted ? (decrypted[msg.id] ?? '') : msg.text,
  }));

  return { messages, loading };
}