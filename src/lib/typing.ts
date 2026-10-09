import { Timestamp } from 'firebase/firestore';
import type { Conversation } from '@/types/chats';

/** While keys keep coming, the writer announces again at most this often. */
export const TYPING_REFRESH_MS = 5000;

/** After this long with no keystroke, the writer clears its entry. */
export const TYPING_IDLE_MS = 4000;

/**
 * A reader ignores an entry further than this from its own clock, in either
 * direction. Typing normally ends with an explicit clear; this only covers a
 * writer that closed the tab or lost the network. The margin over
 * TYPING_REFRESH_MS absorbs clock skew between devices.
 */
export const TYPING_TTL_MS = 12000;

export type TypingSource = Pick<Conversation, 'participants' | 'typing'>;

// The value comes from another client, so it is checked and not trusted to be
// a Timestamp. null is this device's own write, still waiting on the server.
function liveAtMs(at: unknown, nowMs: number): number | null {
  if (!(at instanceof Timestamp)) return null;
  const atMs = at.toMillis();
  return Math.abs(nowMs - atMs) < TYPING_TTL_MS ? atMs : null;
}

/** The participants typing in a conversation right now, leaving out `myUid`. */
export function getTypingUids(conversation: TypingSource, myUid: string, nowMs: number): string[] {
  const typing = conversation.typing;
  if (!typing) return [];
  return conversation.participants.filter((uid) => uid !== myUid && liveAtMs(typing[uid], nowMs) !== null);
}

/** When the next live entry runs out, so the caller can look again then. null when nobody is typing. */
export function nextTypingExpiry(conversations: TypingSource[], myUid: string, nowMs: number): number | null {
  let next: number | null = null;
  for (const conversation of conversations) {
    const typing = conversation.typing;
    if (!typing) continue;
    for (const uid of conversation.participants) {
      if (uid === myUid) continue;
      const atMs = liveAtMs(typing[uid], nowMs);
      if (atMs === null) continue;
      const expiry = atMs + TYPING_TTL_MS;
      if (next === null || expiry < next) next = expiry;
    }
  }
  return next;
}

/**
 * The chat list line for a chat someone is typing in. A direct chat needs no
 * name, because the row already carries it.
 */
export function formatTyping(firstNames: string[], isGroup: boolean): string {
  if (!isGroup || firstNames.length === 0) return 'typing…';
  if (firstNames.length === 1) return `${firstNames[0]} is typing…`;
  if (firstNames.length === 2) return `${firstNames[0]} and ${firstNames[1]} are typing…`;
  return `${firstNames.length} people are typing…`;
}
