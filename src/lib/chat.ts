import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, Message } from '@/types/chats';

export async function sendMessage(
  conversationId: string,
  senderId: string,
  participantIds: string[],
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const batch = writeBatch(db);
  const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));

  batch.set(messageRef, {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  const updates: Record<string, unknown> = {
    lastMessage: trimmed,
    lastMessageSenderId: senderId,
    lastMessageAt: serverTimestamp(),
  };
  participantIds
    .filter((uid) => uid !== senderId)
    .forEach((uid) => {
      updates[`unreadCount.${uid}`] = increment(1);
    });

  batch.update(doc(db, 'conversations', conversationId), updates);
  await batch.commit();
}

export async function markConversationRead(conversationId: string, uid: string) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCount.${uid}`]: 0,
    [`lastRead.${uid}`]: serverTimestamp(),
  });
}

export function isReadByOther(conversation: Conversation, otherUid: string): boolean {
  const lastRead = conversation.lastRead?.[otherUid];
  if (!lastRead || !conversation.lastMessageAt) return false;
  return lastRead.toMillis() >= conversation.lastMessageAt.toMillis();
}

export function isMessageReadBy(message: Message, readerLastRead?: Timestamp | null): boolean {
  if (!readerLastRead || !message.createdAt) return false;
  return readerLastRead.toMillis() >= message.createdAt.toMillis();
}

// Stable per-uid avatar tint so colors don't shift as the list reorders.
export function colorIndexForId(id: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % modulo;
}

export function formatMessageTime(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
}

export function groupMessagesByDay(messages: Message[]): { label: string; items: Message[] }[] {
  const groups: { label: string; items: Message[] }[] = [];
  messages.forEach((m) => {
    const label = m.createdAt ? dayLabel(m.createdAt.toDate()) : (groups[groups.length - 1]?.label ?? 'Today');
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  });
  return groups;
}

function dayLabel(date: Date): string {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}