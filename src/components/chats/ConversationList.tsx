import { COLOR } from '@/lib/constants';
import { Check, CheckCheck, Lock, Plus, Search } from 'lucide-react';
import { Avatar } from '../Avatar';

type IContact = {
  id: number;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  fromMe: boolean;
  read?: undefined;
} | {
  id: number;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  fromMe: boolean;
  read: boolean;
}

type ConversationListProps = {
  mobileShowChat: boolean,
  contacts: IContact[],
  activeId?: number,
  onContactSelect: (activeId: number) => void
}

export default function ConversationList({ mobileShowChat = false, contacts, activeId = 0, onContactSelect }: ConversationListProps) {
  return (
    <aside
      className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex flex-col w-full shrink-0 border-r`}
      style={{ maxWidth: '400px', borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
      aria-label="Chat list"
    >
      <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: COLOR.hairline }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold" style={{ color: COLOR.ink }}>
            Chats
          </h1>
          <button
            type="button"
            aria-label="Start new conversation"
            className="wc-icon-btn wc-focus rounded-full p-2 transition-colors"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: COLOR.muted }}>
          <Lock size={12} aria-hidden="true" />
          End-to-end encrypted
        </p>
      </div>

      <div className="px-4 py-3">
        <label htmlFor="wc-search" className="sr-only">
          Search conversations
        </label>
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: 14, color: COLOR.muted }}
          />
          <input
            id="wc-search"
            type="text"
            placeholder="Search conversations"
            className="wc-focus w-full rounded-full py-2.5 text-sm"
            style={{
              backgroundColor: COLOR.paleBlue,
              color: COLOR.ink,
              paddingLeft: 40,
              paddingRight: 16,
            }}
          />
        </div>
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto wc-scroll">
        <ul>
          {contacts.map((c, i) => {
            const isActive = c.id === activeId;
            const isUnread = c.unread > 0;
            return (
              <li key={c.id} className='group'>
                <button
                  type="button"
                  onClick={() => onContactSelect(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className="wc-item wc-focus w-full group-hover:cursor-pointer flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? COLOR.paleBlue : 'transparent',
                    borderLeft: `3px solid ${isActive ? COLOR.primary : 'transparent'}`,
                  }}
                >
                  <Avatar initials={c.initials} index={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate"
                        style={{ color: COLOR.ink, fontWeight: isUnread ? 700 : 500 }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="text-xs shrink-0"
                        style={{ color: isUnread ? COLOR.primary : COLOR.muted, fontWeight: isUnread ? 700 : 400 }}
                      >
                        {c.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span
                        className="truncate text-sm flex items-center gap-1 min-w-0"
                        style={{ color: isUnread ? COLOR.ink : COLOR.muted, fontWeight: isUnread ? 600 : 400 }}
                      >
                        {c.fromMe &&
                          (c.read ? (
                            <CheckCheck size={14} aria-hidden="true" style={{ color: COLOR.primary, flexShrink: 0 }} />
                          ) : (
                            <Check size={14} aria-hidden="true" style={{ color: COLOR.muted, flexShrink: 0 }} />
                          ))}
                        <span className="truncate">{c.lastMessage}</span>
                      </span>
                      {isUnread && (
                        <span
                          aria-hidden="true"
                          className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0"
                          style={{ minWidth: 20, height: 20, backgroundColor: COLOR.primary, color: COLOR.white, padding: '0 6px' }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUnread && <span className="sr-only">{c.unread} unread messages</span>}
                  {c.fromMe && <span className="sr-only">{c.read ? 'Read' : 'Delivered'}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>)
}
