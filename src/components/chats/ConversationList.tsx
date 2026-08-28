import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Lock, Check, CheckCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, isLastMessageReadByAll, getConversationTitle, getOtherParticipant } from '../../lib/chat';
import { searchUsers, type UserProfile } from '../../lib/users';
import type { Conversation } from '@/types/chats';
import { Avatar } from '../Avatar';
import { ProfileBar } from './ProfileBar';
import { Popover, PopoverItem } from '../ui/Popover';

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

  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim().toLowerCase();

  const filteredConversations = conversations.filter((c) => {
    if (!user || !trimmedQuery) return true;
    return getConversationTitle(c, user.uid).toLowerCase().includes(trimmedQuery);
  });

  useEffect(() => {
    if (!user || !trimmedQuery) {
      setUserResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsers(trimmedQuery, user.uid);
        const existingUids = new Set(
          conversations
            .filter((c) => !c.isGroup)
            .map((c) => c.participants.find((p) => p !== user.uid))
            .filter(Boolean) as string[],
        );
        setUserResults(results.filter((u) => !existingUids.has(u.uid)));
      } catch (err) {
        console.error('User search failed', err);
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [trimmedQuery, user, conversations]);

  function handleStartConversation(u: UserProfile) {
    onStartConversation(u);
    setQuery('');
  }

  return (
    <aside
      className={`${mobileHidden ? 'hidden' : 'flex'} md:flex flex-col w-full shrink-0 border-r border-hairline dark:border-hairline-dark bg-white dark:bg-surface`}
      style={{ maxWidth: 400 }}
      aria-label="Chat list"
    >
      <div className="px-5 pt-6 pb-4 border-b border-hairline dark:border-hairline-dark relative">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink dark:text-pale-blue">Chats</h1>
          <Popover icon={<Plus size={20} aria-hidden="true" />} label="Start new conversation">
            <PopoverItem
              icon={<UserPlus size={17} aria-hidden="true" className="text-muted dark:text-mist" />}
              onClick={() => searchInputRef.current?.focus()}
            >
              New chat
            </PopoverItem>
            <PopoverItem
              icon={<Users size={17} aria-hidden="true" className="text-muted dark:text-mist" />}
              onClick={onOpenNewGroup}
            >
              New group
            </PopoverItem>
          </Popover>
        </div>
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-muted dark:text-mist">
          <Lock size={12} aria-hidden="true" /> End-to-end encrypted
        </p>
      </div>

      <div className="px-4 py-3">
        <label htmlFor="wc-search" className="sr-only">Search conversations or people</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 text-muted dark:text-mist" style={{ left: 14 }} />
          <input
            id="wc-search"
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations or people"
            className="wc-focus w-full rounded-full py-2.5 pl-10 pr-4 text-sm bg-pale-blue dark:bg-ink text-ink dark:text-pale-blue placeholder:text-muted dark:placeholder:text-mist"
          />
        </div>
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto wc-scroll">
        {!trimmedQuery && conversations.length === 0 && (
          <p className="px-5 py-6 text-sm text-center text-muted dark:text-mist">No conversations yet</p>
        )}

        <ul>
          {filteredConversations.map((c) => {
            if (!user) return null;
            const title = getConversationTitle(c, user.uid);
            const other = getOtherParticipant(c, user.uid);
            const unread = c.unreadCount?.[user.uid] ?? 0;
            const isUnread = unread > 0;
            const isActive = c.id === activeConversationId;
            const fromMe = c.lastMessageSenderId === user.uid;
            const readByAll = fromMe && isLastMessageReadByAll(c);
            const senderPrefix = c.isGroup && c.lastMessageSenderId && !fromMe
              ? `${c.participantInfo[c.lastMessageSenderId]?.name?.split(' ')[0] ?? ''}: `
              : '';

            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`wc-item wc-focus w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-[3px] ${isActive
                      ? 'bg-pale-blue dark:bg-accent/10 border-l-primary dark:border-l-accent'
                      : 'bg-transparent border-l-transparent'
                    }`}
                >
                  <Avatar initials={other?.initials ?? '#'} uid={other?.uid ?? c.id} isGroup={c.isGroup} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-ink dark:text-pale-blue ${isUnread ? 'font-bold' : 'font-medium'}`}>
                        {title}
                      </span>
                      <span className={`text-xs shrink-0 ${isUnread ? 'text-primary dark:text-accent font-bold' : 'text-muted dark:text-mist font-normal'}`}>
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`truncate text-sm flex items-center gap-1 min-w-0 ${isUnread ? 'text-ink dark:text-pale-blue font-semibold' : 'text-muted dark:text-mist font-normal'}`}>
                        {fromMe &&
                          (readByAll ? (
                            <CheckCheck size={14} aria-hidden="true" className="text-primary dark:text-accent shrink-0" />
                          ) : (
                            <Check size={14} aria-hidden="true" className="text-muted dark:text-mist shrink-0" />
                          ))}
                        <span className="truncate">{senderPrefix}{c.lastMessage || 'Say hello 👋'}</span>
                      </span>
                      {isUnread && (
                        <span
                          aria-hidden="true"
                          className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0 min-w-5 h-5 px-1.5 bg-primary dark:bg-accent text-white dark:text-ink"
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUnread && <span className="sr-only">{unread} unread messages</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {trimmedQuery && (searching || userResults.length > 0) && (
          <>
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-semibold uppercase text-muted dark:text-mist" style={{ letterSpacing: '0.04em' }}>
                Start a conversation
              </span>
            </div>
            {searching && <p className="px-5 py-3 text-sm text-muted dark:text-mist">Searching…</p>}
            <ul>
              {userResults.map((u) => (
                <li key={u.uid}>
                  <button
                    type="button"
                    onClick={() => handleStartConversation(u)}
                    className="wc-item wc-focus w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  >
                    <Avatar initials={u.initials} uid={u.uid} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink dark:text-pale-blue">{u.name}</p>
                      <p className="truncate text-xs text-muted dark:text-mist">{u.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {trimmedQuery && !searching && filteredConversations.length === 0 && userResults.length === 0 && (
          <p className="px-5 py-6 text-sm text-center text-muted dark:text-mist">No results found</p>
        )}
      </nav>
      <ProfileBar />
    </aside>
  );
}