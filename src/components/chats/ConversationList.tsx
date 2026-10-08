import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DIRECT_MESSAGE_PREVIEW,
  formatRelativeTime,
  getConversationTitle,
  getDeliveryStatus,
  getOtherParticipant,
  isLastMessageReadByAll,
} from '../../lib/chat';
import { searchUsers, type UserProfile } from '../../lib/users';
import { cn } from '@/lib/helpers';
import { useChatPreferences } from '@/context/ChatPreferencesContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Conversation } from '@/types/chats';
import { ChatListItem } from './ChatListItem';
import { ConnectionBanner } from './ConnectionBanner';
import { PersonRow } from './PersonRow';
import { ProfileBar } from './ProfileBar';
import { Popover, PopoverItem } from '../ui/Popover';
import { SearchField } from '../ui/SearchField';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onStartConversation: (profile: UserProfile) => void;
  onOpenNewGroup: () => void;
  mobileHidden?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onStartConversation,
  onOpenNewGroup,
  mobileHidden = false,
}: ConversationListProps) {
  const { user } = useAuth();
  const { timestampFormat } = useChatPreferences();
  const networkStatus = useNetworkStatus();

  const [query, setQuery] = useState('');
  // People results are kept with the query they answer. Until the results
  // for what is typed now arrive, the search is still running.
  const [peopleSearch, setPeopleSearch] = useState<{ query: string; results: UserProfile[] } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim().toLowerCase();
  const searchSettled = peopleSearch?.query === trimmedQuery;
  const userResults = trimmedQuery && searchSettled ? peopleSearch.results : [];
  const searching = Boolean(user && trimmedQuery) && !searchSettled;

  const filteredConversations = conversations.filter((c) => {
    if (!user || !trimmedQuery) return true;
    return getConversationTitle(c, user.uid).toLowerCase().includes(trimmedQuery);
  });

  useEffect(() => {
    if (!user || !trimmedQuery) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      let results: UserProfile[] = [];
      try {
        const found = await searchUsers(trimmedQuery, user.uid);
        const existingUids = new Set(
          conversations
            .filter((c) => !c.isGroup)
            .map((c) => c.participants.find((p) => p !== user.uid))
            .filter(Boolean) as string[],
        );
        results = found.filter((u) => !existingUids.has(u.uid));
      } catch (err) {
        console.error('User search failed', err);
      }
      // A slower, older search must not replace the results for a newer query.
      if (!cancelled) setPeopleSearch({ query: trimmedQuery, results });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmedQuery, user, conversations]);

  function handleStartConversation(u: UserProfile) {
    onStartConversation(u);
    setQuery('');
  }

  return (
    <aside
      className={cn(
        mobileHidden ? 'hidden' : 'flex',
        'w-full shrink-0 flex-col bg-surface md:flex md:max-w-100 md:border-r md:border-line',
      )}
      aria-label="Chat list"
    >
      <div className="flex h-15 shrink-0 items-center justify-between pr-1 pl-4">
        <h1 className="text-title text-ink">Chats</h1>
        <Popover icon="compose" label="New chat or group">
          <PopoverItem icon="user-plus" onClick={() => searchInputRef.current?.focus()}>
            New chat
          </PopoverItem>
          <PopoverItem icon="users" onClick={onOpenNewGroup}>
            New group
          </PopoverItem>
        </Popover>
      </div>

      <ConnectionBanner state={networkStatus} />

      <div className="shrink-0 px-4 py-2">
        <SearchField ref={searchInputRef} label="Search chats or people" value={query} onChange={setQuery} />
      </div>

      <nav aria-label="Chats" className="wc-scroll flex-1 overflow-y-auto">
        {!trimmedQuery && conversations.length === 0 && (
          <p className="px-4 py-6 text-center text-subhead text-ink-muted">No chats yet</p>
        )}

        <ul>
          {filteredConversations.map((c) => {
            if (!user) return null;
            const other = getOtherParticipant(c, user.uid);
            const fromMe = c.lastMessageSenderId === user.uid;
            const sender = !c.isGroup || !c.lastMessageSenderId
              ? undefined
              : fromMe
                ? 'You'
                : c.participantInfo[c.lastMessageSenderId]?.name?.split(' ')[0] || undefined;
            // A direct message is never previewed, whatever an older version stored here.
            const preview = !c.lastMessage ? 'No messages yet' : c.isGroup ? c.lastMessage : DIRECT_MESSAGE_PREVIEW;

            return (
              <ChatListItem
                key={c.id}
                name={getConversationTitle(c, user.uid)}
                id={other?.uid ?? c.id}
                preview={preview}
                sender={sender}
                time={formatRelativeTime(c.lastMessageAt, timestampFormat === '12h')}
                unread={c.unreadCount?.[user.uid] ?? 0}
                status={
                  fromMe
                    ? getDeliveryStatus({
                        pending: c.lastMessageAt === null,
                        read: isLastMessageReadByAll(c),
                        offline: networkStatus === 'offline',
                      })
                    : undefined
                }
                selected={c.id === activeConversationId}
                onClick={() => onSelect(c.id)}
              />
            );
          })}
        </ul>

        {trimmedQuery && (searching || userResults.length > 0) && (
          <>
            <h2 className="px-4 pt-3 pb-1 text-footnote font-semibold text-ink-muted">Start a conversation</h2>
            {searching && (
              <p role="status" className="px-4 py-3 text-subhead text-ink-muted">
                Searching…
              </p>
            )}
            <ul>
              {userResults.map((u) => (
                <PersonRow key={u.uid} name={u.name} id={u.uid} email={u.email} onClick={() => handleStartConversation(u)} />
              ))}
            </ul>
          </>
        )}

        {trimmedQuery && !searching && filteredConversations.length === 0 && userResults.length === 0 && (
          <p className="px-4 py-6 text-center text-subhead text-ink-muted">No results</p>
        )}
      </nav>
      <ProfileBar />
    </aside>
  );
}
