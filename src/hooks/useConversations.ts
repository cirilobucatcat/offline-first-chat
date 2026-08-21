import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Conversation } from '@/types/chats';
import { db } from '@/lib/firebase';

export function useConversations(uid: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation)));
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
        [currentUser.uid]: { name: currentUser.name, initials: currentUser.initials },
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