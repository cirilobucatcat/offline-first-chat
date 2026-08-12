import { COLOR } from '@/lib/constants';
import { Check, CheckCheck, Lock, Plus, Search } from 'lucide-react';
import { Avatar } from '../Avatar';
import type { Conversation } from '@/types/chats';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeTime, isReadByOther } from '@/lib/chat';
import { searchUsers, type UserProfile } from '@/lib/users';
import { useEffect, useRef, useState } from 'react';

type ConversationListProps = {
  conversations: Conversation[]
  activeConversationId: string | null,
  mobileHidden?: boolean,
  onStartConversation: (profile: UserProfile) => Promise<void>;
  onSelect: (id: string) => void
}

export default function ConversationList({ mobileHidden = false, onStartConversation, conversations, activeConversationId, onSelect }: ConversationListProps) {
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredConversations = conversations.filter((c) => {
    if (!user || !trimmedQuery) return true;
    const otherUid = c.participants.find((p) => p !== user.uid);
    const name = otherUid ? c.participantInfo[otherUid]?.name ?? '' : '';
    return name.toLowerCase().includes(trimmedQuery);
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
          conversations.map((c) => c.participants.find((p) => p !== user.uid)).filter(Boolean) as string[],
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
      className={`${mobileHidden ? 'hidden' : 'flex'} md:flex flex-col w-full shrink-0 border-r`}
      style={{ maxWidth: '400px', borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
      aria-label="Chat list"
    >
      <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: COLOR.hairline }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold" style={{ color: COLOR.ink }}>Chats</h1>
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            aria-label="Start new conversation"
            className="wc-icon-btn wc-focus rounded-full p-2 transition-colors"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: COLOR.muted }}>
          <Lock size={12} aria-hidden="true" /> End-to-end encrypted
        </p>
      </div>

      <div className="px-4 py-3">
        <label htmlFor="wc-search" className="sr-only">Search conversations or people</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2" style={{ left: 14, color: COLOR.muted }} />
          <input
            id="wc-search"
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations or people"
            className="wc-focus w-full rounded-full py-2.5 text-sm"
            style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink, paddingLeft: 40, paddingRight: 16 }}
          />
        </div>
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto wc-scroll">
        {!trimmedQuery && conversations.length === 0 && (
          <p className="px-5 py-6 text-sm text-center" style={{ color: COLOR.muted }}>No conversations yet</p>
        )}

        <ul>
          {filteredConversations.map((c, i) => {
            if (!user) return null;
            const otherUid = c.participants.find((p) => p !== user.uid);
            const other = otherUid ? c.participantInfo[otherUid] : undefined;
            const unread = c.unreadCount?.[user.uid] ?? 0;
            const isUnread = unread > 0;
            const isActive = c.id === activeConversationId;
            const fromMe = c.lastMessageSenderId === user.uid;
            const readByOther = fromMe && otherUid ? isReadByOther(c, otherUid) : false;

            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className="wc-item wc-focus w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? COLOR.paleBlue : 'transparent',
                    borderLeft: `3px solid ${isActive ? COLOR.primary : 'transparent'}`,
                  }}
                >
                  <Avatar initials={other?.initials ?? '?'} uid={otherUid ?? c.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate" style={{ color: COLOR.ink, fontWeight: isUnread ? 700 : 500 }}>
                        {other?.name ?? 'Unknown'}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: isUnread ? COLOR.primary : COLOR.muted, fontWeight: isUnread ? 700 : 400 }}>
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="truncate text-sm flex items-center gap-1 min-w-0" style={{ color: isUnread ? COLOR.ink : COLOR.muted, fontWeight: isUnread ? 600 : 400 }}>
                        {fromMe &&
                          (readByOther ? (
                            <CheckCheck size={14} aria-hidden="true" style={{ color: COLOR.primary, flexShrink: 0 }} />
                          ) : (
                            <Check size={14} aria-hidden="true" style={{ color: COLOR.muted, flexShrink: 0 }} />
                          ))}
                        <span className="truncate">{c.lastMessage || 'Say hello 👋'}</span>
                      </span>
                      {isUnread && (
                        <span aria-hidden="true" className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0" style={{ minWidth: 20, height: 20, backgroundColor: COLOR.primary, color: COLOR.white, padding: '0 6px' }}>
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
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLOR.muted, letterSpacing: '0.04em' }}>
                Start a conversation
              </span>
            </div>
            {searching && <p className="px-5 py-3 text-sm" style={{ color: COLOR.muted }}>Searching…</p>}
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
                      <p className="truncate font-medium" style={{ color: COLOR.ink }}>{u.name}</p>
                      <p className="truncate text-xs" style={{ color: COLOR.muted }}>{u.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {trimmedQuery && !searching && filteredConversations.length === 0 && userResults.length === 0 && (
          <p className="px-5 py-6 text-sm text-center" style={{ color: COLOR.muted }}>No results found</p>
        )}
      </nav>
    </aside>)
}
