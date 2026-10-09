import { useEffect, useMemo, useState } from 'react';
import type { Conversation } from '@/types/chats';
import { getTypingUids, nextTypingExpiry } from '@/lib/typing';
import { useNetworkStatus } from './useNetworkStatus';

const NOBODY: ReadonlyMap<string, string[]> = new Map();

/**
 * Who is typing in each conversation, keyed by conversation id. Empty while
 * offline: typing is only shown while connected.
 *
 * `receivedAt` is when `conversations` arrived. Rendering cannot read the
 * clock, so "now" is that moment or the last time an entry ran out,
 * whichever is later.
 */
export function useTypingStatus(
  conversations: Conversation[],
  receivedAt: number,
  myUid: string | null,
): ReadonlyMap<string, string[]> {
  const offline = useNetworkStatus() === 'offline';
  const [tickedAt, setTickedAt] = useState(0);
  const now = Math.max(receivedAt, tickedAt);

  // Look again when the next entry runs out, so a writer that vanished stops
  // showing without a new snapshot. This keeps running offline: by the time
  // the connection is back, nothing left in the cache still counts as live.
  useEffect(() => {
    if (!myUid) return;
    const expiry = nextTypingExpiry(conversations, myUid, now);
    if (expiry === null) return;
    const timeout = setTimeout(() => setTickedAt(Date.now()), expiry - now);
    return () => clearTimeout(timeout);
  }, [conversations, myUid, now]);

  return useMemo(() => {
    if (!myUid || offline) return NOBODY;
    const byConversation = new Map<string, string[]>();
    for (const conversation of conversations) {
      const uids = getTypingUids(conversation, myUid, now);
      if (uids.length > 0) byConversation.set(conversation.id, uids);
    }
    return byConversation;
  }, [conversations, myUid, offline, now]);
}
