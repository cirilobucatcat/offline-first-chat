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

/**
 * What the chat list shows for a direct message. The conversation doc is
 * readable by the server, so the preview is never the plaintext.
 */
export const DIRECT_MESSAGE_PREVIEW = 'New message';

export interface SendMessageOptions {
  isGroup: boolean;
  myPrivateKey: CryptoKey;
}

/**
 * Thrown by sendMessage when the other person in a direct chat has no
 * published key. Nothing has been written when this is thrown.
 */
export class PeerKeyMissingError extends Error {
  constructor() {
    super('Cannot send: recipient has not set up encryption yet.');
    this.name = 'PeerKeyMissingError';
  }
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
      throw new PeerKeyMissingError();
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
    updates.lastMessage = DIRECT_MESSAGE_PREVIEW;
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

function isReadByAll(conversation: Conversation, senderUid: string, at: Timestamp | null | undefined): boolean {
  if (!at) return false;
  const others = conversation.participants.filter((p) => p !== senderUid);
  if (others.length === 0) return false;
  const atMs = at.toMillis();
  return others.every((uid) => {
    const lastRead = conversation.lastRead?.[uid];
    return !!lastRead && lastRead.toMillis() >= atMs;
  });
}

export function isLastMessageReadByAll(conversation: Conversation): boolean {
  if (!conversation.lastMessageSenderId) return false;
  return isReadByAll(conversation, conversation.lastMessageSenderId, conversation.lastMessageAt);
}

export function isMessageReadByAll<T extends { createdAt: Timestamp | null | undefined }>(
  conversation: Conversation,
  senderUid: string,
  message: T,
): boolean {
  return isReadByAll(conversation, senderUid, message.createdAt);
}

/**
 * Where one of your own messages is. A write the server has not acknowledged
 * is `queued` with no network and `sending` with one. The app has no delivery
 * receipt and no failed-write state, so `delivered` and `failed` never come up.
 */
export function getDeliveryStatus({
  pending,
  read,
  offline,
}: {
  pending: boolean;
  read: boolean;
  offline: boolean;
}): 'queued' | 'sending' | 'sent' | 'read' {
  if (pending) return offline ? 'queued' : 'sending';
  return read ? 'read' : 'sent';
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

const timeFormatters = new Map<boolean, Intl.DateTimeFormat>();

function timeFormatter(hour12: boolean): Intl.DateTimeFormat {
  let formatter = timeFormatters.get(hour12);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', hour12 });
    timeFormatters.set(hour12, formatter);
  }
  return formatter;
}

/** @param hour12 Defaults to true, matching prior (locale-default) behavior for existing callers. */
export function formatMessageTime(timestamp: Timestamp, hour12 = true): string {
  return timeFormatter(hour12).format(timestamp.toDate());
}

export function formatRelativeTime(timestamp: Timestamp | null | undefined, hour12 = true): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return timeFormatter(hour12).format(date);
  }
  // The six days before today read as a weekday; anything older as a date.
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  if (date >= weekStart && date < now) return date.toLocaleDateString([], { weekday: 'short' });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Where a message sits in its run of consecutive messages from one sender. */
export function runPosition(index: number, length: number): 'single' | 'first' | 'middle' | 'last' {
  if (length <= 1) return 'single';
  if (index <= 0) return 'first';
  if (index >= length - 1) return 'last';
  return 'middle';
}

const RUN_GAP_MS = 5 * 60 * 1000;

/**
 * Splits messages into runs: consecutive messages from one sender, on the
 * same day, each within five minutes of the one before. A message the server
 * has not acknowledged yet has no time, so it counts as sent now.
 */
export function groupMessagesIntoRuns<T extends { senderId: string; createdAt: Timestamp | null | undefined }>(
  messages: T[],
): T[][] {
  const runs: T[][] = [];
  let previous: { senderId: string; at: Date } | null = null;
  for (const m of messages) {
    const at = m.createdAt ? m.createdAt.toDate() : new Date();
    const joins =
      previous !== null &&
      previous.senderId === m.senderId &&
      previous.at.toDateString() === at.toDateString() &&
      at.getTime() - previous.at.getTime() <= RUN_GAP_MS;
    if (joins) runs[runs.length - 1].push(m);
    else runs.push([m]);
    previous = { senderId: m.senderId, at };
  }
  return runs;
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