import { useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import type { Conversation } from '@/types/chats';
import { db } from '@/lib/firebase';
import { playMessageSound, updateTabBadge } from '@/lib/notifications';

function toMillisOrNull(ts: Timestamp | null | undefined): number | null {
  return ts ? ts.toMillis() : null;
}

export function useConversations(uid: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Previous snapshot, keyed by conversation id — lets us tell a genuine
  // new incoming message apart from a read-receipt update, our own
  // outgoing message, or the very first load (where every conversation
  // is "new" to this hook instance but none of them should ding).
  // null specifically means "haven't received a first snapshot yet."
  const previousByIdRef = useRef<Map<string, Conversation> | null>(null);

  useEffect(() => {
    previousByIdRef.current = null;

    if (!uid) {
      setConversations([]);
      setLoading(false);
      updateTabBadge(0);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Conversation,
      );

      const previousById = previousByIdRef.current;
      if (previousById) {
        for (const convo of next) {
          const prev = previousById.get(convo.id);
          const prevMs = toMillisOrNull(
            prev?.lastMessageAt as Timestamp | null,
          );
          const nextMs = toMillisOrNull(
            convo.lastMessageAt as Timestamp | null,
          );

          const isNewMessage = nextMs !== null && nextMs !== prevMs;
          const isFromSomeoneElse =
            !!convo.lastMessageSenderId && convo.lastMessageSenderId !== uid;

          if (isNewMessage && isFromSomeoneElse) {
            playMessageSound();
            break; // one sound per snapshot batch, even if several conversations changed at once
          }
        }
      }

      previousByIdRef.current = new Map(next.map((c) => [c.id, c]));

      const totalUnread = next.reduce(
        (sum, c) => sum + (c.unreadCount?.[uid] ?? 0),
        0,
      );
      updateTabBadge(totalUnread);

      setConversations(next);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { conversations, loading };
}

export function getConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export async function createOrGetConversation(
  currentUser: { uid: string; name: string; initials: string },
  other: { uid: string; name: string; initials: string },
): Promise<string> {
  const conversationId = getConversationId(currentUser.uid, other.uid);
  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [currentUser.uid, other.uid],
      participantInfo: {
        [currentUser.uid]: {
          name: currentUser.name,
          initials: currentUser.initials,
        },
        [other.uid]: { name: other.name, initials: other.initials },
      },
      lastMessage: '',
      lastMessageSenderId: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: { [currentUser.uid]: 0, [other.uid]: 0 },
      lastRead: {},
    });
  }

  return conversationId;
}
