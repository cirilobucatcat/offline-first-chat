import { useState } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Plus,
  Lock,
  Check,
  CheckCheck,
  ChevronLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Brand tokens — derived strictly from the WeakChat palette (Primary / Pale
// Blue / Ink). "Muted" and "hairline" are alpha derivatives of Ink and
// Primary respectively, so no new hues enter the system.
// ---------------------------------------------------------------------------
const COLOR = {
  primary: '#0D47A1',
  paleBlue: '#E3F2FD',
  ink: '#0F3040',
  white: '#FFFFFF',
  muted: 'rgba(15, 48, 64, 0.72)',
  hairline: 'rgba(13, 71, 161, 0.14)',
};

const AVATAR_TINTS = ['#0D47A1', '#123E6B', '#0F3040', '#15508F'];

// ---------------------------------------------------------------------------
// Mock data — presentational only, nothing here is wired to real state.
// ---------------------------------------------------------------------------
const CONTACTS = [
  { id: 1, name: 'Maya Santos', initials: 'MS', lastMessage: "Sure, let's sync tomorrow at 10", time: '9:41 AM', unread: 2, fromMe: false },
  { id: 2, name: 'Jordan Lee', initials: 'JL', lastMessage: 'Sent the design files over', time: 'Yesterday', unread: 0, fromMe: true, read: true },
  { id: 3, name: 'Priya Kapoor', initials: 'PK', lastMessage: 'Can you check the offline sync bug?', time: 'Yesterday', unread: 1, fromMe: false },
  { id: 4, name: 'Design Team', initials: 'DT', lastMessage: 'Alex: Updated the mockups ✨', time: 'Mon', unread: 0, fromMe: false },
  { id: 5, name: 'Chris Okafor', initials: 'CO', lastMessage: '👍 Sounds good', time: 'Fri', unread: 0, fromMe: true, read: true },
  { id: 6, name: 'Nina Petrova', initials: 'NP', lastMessage: 'See you at 5!', time: 'Thu', unread: 1, fromMe: false },
  { id: 7, name: 'Sam Rivera', initials: 'SR', lastMessage: 'Just sent it your way!', time: 'Wed', unread: 0, fromMe: true, read: false },
];

const THREADS: Record<number, any[]> = {
  1: [
    { id: 'd', type: 'divider', label: 'Today' },
    { id: 1, sender: 'them', text: 'Hey! Are we still on for the sync tomorrow?', time: '9:12 AM' },
    { id: 2, sender: 'me', text: 'Yes, 10am works on my end', time: '9:15 AM', read: true },
    { id: 3, sender: 'them', text: "Perfect, I'll share the agenda tonight", time: '9:16 AM' },
    { id: 4, sender: 'me', text: 'Sounds good 👍', time: '9:20 AM', read: true },
    { id: 5, sender: 'them', text: "Sure, let's sync tomorrow at 10", time: '9:41 AM' },
  ],
  2: [
    { id: 'd', type: 'divider', label: 'Yesterday' },
    { id: 1, sender: 'them', text: 'Did you get a chance to look at the offline cache PR?', time: '3:02 PM' },
    { id: 2, sender: 'me', text: 'Yep, looks solid — left a couple comments', time: '3:10 PM', read: true },
    { id: 3, sender: 'me', text: 'Sent the design files over', time: '3:12 PM', read: true },
  ],
  3: [
    { id: 'd', type: 'divider', label: 'Yesterday' },
    { id: 1, sender: 'me', text: 'Hey, quick one — are you free for a call later?', time: '10:40 AM', read: true },
    { id: 2, sender: 'them', text: 'Sure, after lunch works', time: '10:50 AM' },
    { id: 3, sender: 'them', text: 'Can you check the offline sync bug?', time: '11:04 AM' },
  ],
  4: [
    { id: 'd', type: 'divider', label: 'Mon' },
    { id: 1, sender: 'them', senderName: 'Jordan', text: 'Pushed the new component library', time: '2:00 PM' },
    { id: 2, sender: 'me', text: 'Looks great, testing now', time: '2:10 PM', read: true },
    { id: 3, sender: 'them', senderName: 'Alex', text: 'Updated the mockups ✨', time: '2:22 PM' },
  ],
  5: [
    { id: 'd', type: 'divider', label: 'Fri' },
    { id: 1, sender: 'them', text: 'Ready for the demo tomorrow?', time: '5:00 PM' },
    { id: 2, sender: 'me', text: 'Almost, just polishing the offline indicator', time: '5:12 PM', read: true },
    { id: 3, sender: 'me', text: '👍 Sounds good', time: '5:15 PM', read: true },
  ],
  6: [
    { id: 'd', type: 'divider', label: 'Thu' },
    { id: 1, sender: 'them', text: 'Still on for coffee?', time: '4:30 PM' },
    { id: 2, sender: 'me', text: 'Yes! Same place as before', time: '4:35 PM', read: true },
    { id: 3, sender: 'them', text: 'See you at 5!', time: '4:36 PM' },
  ],
  7: [
    { id: 'd', type: 'divider', label: 'Wed' },
    { id: 1, sender: 'them', text: 'Can you resend the invite link for tomorrow?', time: '1:00 PM' },
    { id: 2, sender: 'me', text: 'Just sent it your way!', time: '1:05 PM', read: false },
  ],
};

function Avatar({ initials, index, size = 44 }: { initials: string, index: number, size?: number}) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_TINTS[index % AVATAR_TINTS.length],
        color: COLOR.white,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}

export default function WeakChatChatsPage() {
  const [activeId, setActiveId] = useState(CONTACTS[0].id);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeIndex = CONTACTS.findIndex((c) => c.id === activeId);
  const active = CONTACTS[activeIndex];
  const thread = THREADS[activeId] || [];

  function selectContact(id: number) {
    setActiveId(id);
    setMobileShowChat(true);
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ fontFamily: "'Outfit', sans-serif", backgroundColor: COLOR.white }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        .wc-scroll::-webkit-scrollbar { width: 6px; }
        .wc-scroll::-webkit-scrollbar-thumb { background-color: ${COLOR.hairline}; border-radius: 9999px; }
        .wc-item:hover { background-color: ${COLOR.paleBlue}; }
        .wc-icon-btn { color: ${COLOR.muted}; }
        .wc-icon-btn:hover { background-color: ${COLOR.paleBlue}; color: ${COLOR.primary}; }
        .wc-focus:focus { outline: none; }
        .wc-focus:focus-visible { outline: 2px solid ${COLOR.primary}; outline-offset: 2px; }
      `}</style>

      {/* ---------------------------------------------------------------- */}
      {/* Left — conversation list                                        */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex flex-col w-full flex-shrink-0 border-r`}
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
            {CONTACTS.map((c, i) => {
              const isActive = c.id === activeId;
              const isUnread = c.unread > 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectContact(c.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className="wc-item wc-focus w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
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
                          className="text-xs flex-shrink-0"
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
                            className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
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
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Right — message area                                             */}
      {/* ---------------------------------------------------------------- */}
      <main
        className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}
        style={{ backgroundColor: COLOR.paleBlue }}
        aria-label={active ? `Conversation with ${active.name}` : 'Conversation'}
      >
        <header
          className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b"
          style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              aria-label="Back to conversation list"
              className="wc-icon-btn wc-focus md:hidden rounded-full p-1.5 -ml-1.5"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <Avatar initials={active?.initials || ''} index={activeIndex} size={40} />
            <div className="min-w-0">
              <h2 className="font-semibold truncate leading-tight" style={{ color: COLOR.ink }}>
                {active?.name}
              </h2>
              <p className="text-xs flex items-center gap-1" style={{ color: COLOR.muted }}>
                <Lock size={11} aria-hidden="true" />
                Encrypted · synced offline
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Conversation options"
            className="wc-icon-btn wc-focus rounded-full p-2 flex-shrink-0"
          >
            <MoreVertical size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto wc-scroll px-4 md:px-10 py-5">
          {thread.map((item) => {
            if (item.type === 'divider') {
              return (
                <div key={item.id} className="flex justify-center py-2">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: COLOR.white, color: COLOR.muted }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }
            const mine = item.sender === 'me';
            return (
              <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                <div style={{ maxWidth: '72%' }}>
                  {!mine && item.senderName && (
                    <span className="text-xs font-medium block mb-1 ml-1" style={{ color: COLOR.primary }}>
                      {item.senderName}
                    </span>
                  )}
                  <div
                    className="px-4 py-2.5"
                    style={{
                      backgroundColor: mine ? COLOR.primary : COLOR.white,
                      color: mine ? COLOR.white : COLOR.ink,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 4 : 18,
                      borderBottomLeftRadius: mine ? 18 : 4,
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ wordBreak: 'break-word' }}>
                      {item.text}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs" style={{ color: mine ? COLOR.paleBlue : COLOR.muted }}>
                        {item.time}
                      </span>
                      {mine &&
                        (item.read ? (
                          <CheckCheck size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />
                        ) : (
                          <Check size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />
                        ))}
                      {mine && <span className="sr-only">{item.read ? 'Read' : 'Delivered'}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center gap-2 px-3 md:px-4 py-3 border-t"
          style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
        >
          <button type="button" aria-label="Attach file" className="wc-icon-btn wc-focus rounded-full p-2 flex-shrink-0">
            <Paperclip size={20} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Add emoji" className="wc-icon-btn wc-focus rounded-full p-2 flex-shrink-0">
            <Smile size={20} aria-hidden="true" />
          </button>
          <label htmlFor="wc-message" className="sr-only">
            Type a message
          </label>
          <input
            id="wc-message"
            type="text"
            placeholder="Type a message"
            className="wc-focus flex-1 rounded-full py-2.5 px-4 text-sm min-w-0"
            style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
          />
          <button
            type="button"
            aria-label="Send message"
            className="wc-focus rounded-full p-2.5 flex-shrink-0"
            style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </main>
    </div>
  );
}