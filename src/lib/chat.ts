import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp,
  arrayUnion,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation } from '@/types/chats';
import { encryptMessageText } from './crypto/messageCrypto';
import { getConversationKey, getDirectConversationPeerUid } from './crypto/conversationKeys';

export interface ParticipantSeed {
  uid: string;
  name: string;
  initials: string;
}

export async function createGroupConversation(
  creator: ParticipantSeed,
  members: ParticipantSeed[],
  groupName: string,
): Promise<string> {
  const allMembers = [creator, ...members];
  const ref = doc(collection(db, 'conversations'));

  const participantInfo: Record<string, { name: string; initials: string }> = {};
  const unreadCount: Record<string, number> = {};
  allMembers.forEach((m) => {
    participantInfo[m.uid] = { name: m.name, initials: m.initials };
    unreadCount[m.uid] = 0;
  });

  await setDoc(ref, {
    participants: allMembers.map((m) => m.uid),
    participantInfo,
    isGroup: true,
    groupName: groupName.trim(),
    createdBy: creator.uid,
    lastMessage: '',
    lastMessageSenderId: '',
    lastMessageAt: serverTimestamp(),
    unreadCount,
    lastRead: {},
  });

  return ref.id;
}

export async function addParticipantsToConversation(
  conversationId: string,
  newMembers: ParticipantSeed[],
): Promise<void> {
  if (newMembers.length === 0) return;

  const updates: Record<string, unknown> = {
    participants: arrayUnion(...newMembers.map((m) => m.uid)),
  };
  newMembers.forEach((m) => {
    updates[`participantInfo.${m.uid}`] = { name: m.name, initials: m.initials };
    updates[`unreadCount.${m.uid}`] = 0;
  });

  await updateDoc(doc(db, 'conversations', conversationId), updates);
}

export interface SendMessageOptions {
  isGroup: boolean;
  myPrivateKey: CryptoKey;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  participantIds: string[],
  text: string,
  options: SendMessageOptions,
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const batch = writeBatch(db);
  const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));

  const updates: Record<string, unknown> = {
    lastMessageSenderId: senderId,
    lastMessageAt: serverTimestamp(),
  };
  participantIds
    .filter((uid) => uid !== senderId)
    .forEach((uid) => {
      updates[`unreadCount.${uid}`] = increment(1);
    });

  if (options.isGroup) {
    batch.set(messageRef, {
      senderId,
      text: trimmed,
      encrypted: false,
      createdAt: serverTimestamp(),
    });
    updates.lastMessage = trimmed;
  } else {
    const peerUid = getDirectConversationPeerUid(participantIds, senderId);
    const key = peerUid
      ? await getConversationKey(conversationId, options.myPrivateKey, peerUid)
      : null;

    if (!key) {
      throw new Error('Cannot send: recipient has not set up encryption yet.');
    }

    const associatedData = `${conversationId}:${senderId}`;
    const { ciphertext, iv, algo } = await encryptMessageText(key, trimmed, associatedData);

    batch.set(messageRef, {
      senderId,
      ciphertext,
      iv,
      algo,
      encrypted: true,
      createdAt: serverTimestamp(),
    });
    updates.lastMessage = '🔒 New message';
  }

  batch.update(doc(db, 'conversations', conversationId), updates);
  await batch.commit();
}

export interface MarkConversationReadOptions {
  /** Whether to advance lastRead — i.e. whether the other person should see
   *  this as "read". unreadCount is always cleared regardless, since that's
   *  purely local (your own badge), not something the other person sees. */
  sendReadReceipt: boolean;
}

export async function markConversationRead(
  conversationId: string,
  uid: string,
  options: MarkConversationReadOptions = { sendReadReceipt: true },
) {
  const updates: Record<string, unknown> = { [`unreadCount.${uid}`]: 0 };
  if (options.sendReadReceipt) {
    updates[`lastRead.${uid}`] = serverTimestamp();
  }
  await updateDoc(doc(db, 'conversations', conversationId), updates);
}

export function isLastMessageReadByAll(conversation: Conversation): boolean {
  if (!conversation.lastMessageAt || !conversation.lastMessageSenderId) return false;
  const others = conversation.participants.filter((p) => p !== conversation.lastMessageSenderId);
  if (others.length === 0) return false;
  return others.every((uid) => {
    const lastRead = conversation.lastRead?.[uid];
    return lastRead && lastRead.toMillis() >= conversation.lastMessageAt!.toMillis();
  });
}

export function isMessageReadByAll<T extends { createdAt: Timestamp | null | undefined }>(
  conversation: Conversation,
  senderUid: string,
  message: T,
): boolean {
  if (!message.createdAt) return false;
  const others = conversation.participants.filter((p) => p !== senderUid);
  if (others.length === 0) return false;
  return others.every((uid) => {
    const lastRead = conversation.lastRead?.[uid];
    return lastRead && lastRead.toMillis() >= message.createdAt!.toMillis();
  });
}

export function colorIndexForId(id: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % modulo;
}

export function getOtherParticipant(conversation: Conversation, currentUid: string): ParticipantSeed | null {
  if (conversation.isGroup) return null;
  const otherUid = conversation.participants.find((p) => p !== currentUid);
  if (!otherUid) return null;
  const info = conversation.participantInfo[otherUid];
  return info ? { uid: otherUid, name: info.name, initials: info.initials } : null;
}

export function getConversationTitle(conversation: Conversation, currentUid: string): string {
  if (conversation.isGroup) return conversation.groupName?.trim() || 'Group chat';
  return getOtherParticipant(conversation, currentUid)?.name ?? 'Unknown';
}

/** @param hour12 Defaults to true, matching prior (locale-default) behavior for existing callers. */
export function formatMessageTime(timestamp: Timestamp, hour12 = true): string {
  return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12 });
}

export function formatRelativeTime(timestamp: Timestamp | null | undefined, hour12 = true): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12 });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
}

export function groupMessagesByDay<T extends { createdAt: Timestamp | null | undefined }>(
  messages: T[],
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
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