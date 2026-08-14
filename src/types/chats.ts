import type { Timestamp } from 'firebase/firestore';

export interface ParticipantInfo {
  name: string;
  initials: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantInfo: Record<string, ParticipantInfo>;
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageAt: Timestamp | null;
  unreadCount: Record<string, number>;
  lastRead: Record<string, Timestamp>;
  isGroup: boolean;
  groupName?: string;
  createdBy?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
}