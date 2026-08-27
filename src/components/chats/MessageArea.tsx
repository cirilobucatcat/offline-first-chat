import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Lock, MoreVertical, ChevronLeft, Paperclip, Smile, Send, Check, CheckCheck, Clock, UserPlus, Users, ShieldAlert } from 'lucide-react';
import {
  sendMessage,
  markConversationRead,
  isMessageReadByAll,
  formatMessageTime,
  groupMessagesByDay,
  getConversationTitle,
  getOtherParticipant,
  RecipientKeyMissingError,
  type ParticipantSeed,
} from '@/lib/chat';
import type { Conversation } from '@/types/chats';
import { Avatar } from '../Avatar';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePeerKeyStatus } from '@/hooks/usePeerKeyStatus';
import { Popover, PopoverItem } from '../ui/Popover';
import { COLOR } from '@/lib/constants';
import { useMyIdentityKey } from '@/context/IdentityContext';

interface MessageAreaProps {
  conversation: Conversation | null;
  onBack: () => void;
  onAddPeople: (conversation: Conversation) => void;
  onCreateGroupWithUser: (participant: ParticipantSeed) => void;
  mobileHidden?: boolean;
}

export function MessageArea({ conversation, onBack, onAddPeople, onCreateGroupWithUser, mobileHidden = false }: MessageAreaProps) {
  const { user } = useAuth();
  const { privateKey } = useMyIdentityKey();
  const other = conversation && user ? getOtherParticipant(conversation, user.uid) : null;
  const { messages } = useMessages(conversation?.id ?? null, other?.uid ?? null);
  const networkStatus = useNetworkStatus();
  const isDirect = !!conversation && !conversation.isGroup;
  const peerKeyStatus = usePeerKeyStatus(isDirect ? other?.uid ?? null : null);
  const keyBlocked = isDirect && peerKeyStatus === 'missing';
  const [draft, setDraft] = useState('');
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const title = conversation && user ? getConversationTitle(conversation, user.uid) : '';

  const myUnread = conversation && user ? (conversation.unreadCount?.[user.uid] ?? 0) : 0;
  useEffect(() => {
    if (!conversation || !user) return;
    if (myUnread === 0) return;
    markConversationRead(conversation.id, user.uid);
  }, [conversation?.id, myUnread, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // A stale notice from a previous conversation shouldn't linger into the next one.
  useEffect(() => {
    setSendNotice(null);
  }, [conversation?.id]);

  // If the peer finishes key setup while an old "not sent" notice is still
  // showing, the banner above already communicates the fix — no need to
  // keep the older reactive notice around too.
  useEffect(() => {
    if (peerKeyStatus === 'ready') setSendNotice(null);
  }, [peerKeyStatus]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!conversation || !user || !draft.trim() || keyBlocked) return;
    const text = draft;
    setDraft('');
    try {
      await sendMessage(conversation.id, user.uid, conversation.participants, text, {
        isGroup: conversation.isGroup,
        myPrivateKey: privateKey,
      });
      setSendNotice(null);
    } catch (err) {
      console.error('Failed to send message', err);
      setDraft(text);
      setSendNotice(
        err instanceof RecipientKeyMissingError
          ? `${title} hasn't set up encryption yet — this message wasn't sent.`
          : 'Something went wrong sending that message. Please try again.',
      );
    }
  }

  if (!conversation) {
    return (
      <main className={`${mobileHidden ? 'hidden' : 'flex'} md:flex flex-1 items-center justify-center`} style={{ backgroundColor: COLOR.paleBlue }}>
        <p style={{ color: COLOR.muted }}>Select a conversation to start chatting</p>
      </main>
    );
  }

  const groups = groupMessagesByDay(messages);

  return (
    <main className={`${mobileHidden ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0`} style={{ backgroundColor: COLOR.paleBlue }} aria-label={`Conversation with ${title}`}>
      <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b" style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}>
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} aria-label="Back to conversation list" className="wc-icon-btn wc-focus md:hidden rounded-full p-1.5 -ml-1.5">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <Avatar initials={other?.initials ?? '#'} uid={other?.uid ?? conversation.id} size={40} isGroup={conversation.isGroup} />
          <div className="min-w-0">
            <h2 className="font-semibold truncate leading-tight" style={{ color: COLOR.ink }}>{title}</h2>
            <p className="text-xs flex items-center gap-1" style={{ color: COLOR.muted }}>
              {!conversation.isGroup && <Lock size={11} aria-hidden="true" />}
              {conversation.isGroup ? 'Synced offline' : 'Encrypted · synced offline'}
            </p>
          </div>
        </div>

        <Popover icon={<MoreVertical size={20} aria-hidden="true" />} label="Conversation options">
          {conversation.isGroup ? (
            <PopoverItem
              icon={<UserPlus size={17} aria-hidden="true" style={{ color: COLOR.muted }} />}
              onClick={() => onAddPeople(conversation)}
            >
              Add people
            </PopoverItem>
          ) : (
            other && (
              <PopoverItem
                icon={<Users size={17} aria-hidden="true" style={{ color: COLOR.muted }} />}
                onClick={() => onCreateGroupWithUser(other)}
              >
                Create group with {other.name.split(' ')[0]}
              </PopoverItem>
            )
          )}
        </Popover>
      </header>

      {keyBlocked && (
        <div
          id="wc-key-blocked-notice"
          role="status"
          className="flex items-center gap-2 px-4 md:px-10 py-2.5 border-b text-sm"
          style={{ backgroundColor: COLOR.white, color: COLOR.muted, borderColor: COLOR.hairline }}
        >
          <ShieldAlert size={15} aria-hidden="true" style={{ color: COLOR.primary, flexShrink: 0 }} />
          <span>{title} hasn't set up encryption yet. You won't be able to send messages until they do.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto wc-scroll px-4 md:px-10 py-5">
        {messages.length === 0 && <p className="text-sm text-center mt-8" style={{ color: COLOR.muted }}>Say hello 👋</p>}
        {groups.map((group, gi) => (
          <div key={`${group.label}-${gi}`}>
            <div className="flex justify-center py-2">
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: COLOR.white, color: COLOR.muted }}>{group.label}</span>
            </div>
            {group.items.map((m) => {
              const mine = m.senderId === user?.uid;
              const read = mine && isMessageReadByAll(conversation, m.senderId, m);
              const senderName = conversation.isGroup && !mine ? conversation.participantInfo[m.senderId]?.name : undefined;
              const queued = mine && !m.createdAt && networkStatus === 'offline';
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div style={{ maxWidth: '72%' }}>
                    {senderName && (
                      <span className="text-xs font-medium block mb-1 ml-1" style={{ color: COLOR.primary }}>
                        {senderName}
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
                      <p className="text-sm leading-relaxed" style={{ wordBreak: 'break-word' }}>{m.displayText}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs" style={{ color: mine ? COLOR.paleBlue : COLOR.muted }}>
                          {m.createdAt ? formatMessageTime(m.createdAt) : 'Sending…'}
                        </span>
                        {mine && (read ? <CheckCheck size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} /> : <Check size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />)}
                        {mine && <span className="sr-only">{read ? 'Read' : 'Delivered'}</span>}
                      </div>
                    </div>
                    {queued && (
                      <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                        <Clock size={11} aria-hidden="true" style={{ color: COLOR.muted }} />
                        <span className="text-xs" style={{ color: COLOR.muted }}>
                          No connection — will send once you're back online
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {sendNotice && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 md:px-10 py-2 text-xs border-t"
          style={{ backgroundColor: COLOR.paleBlue, color: COLOR.muted, borderColor: COLOR.hairline }}
        >
          <ShieldAlert size={13} aria-hidden="true" style={{ color: COLOR.primary, flexShrink: 0 }} />
          <span>{sendNotice}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 md:px-4 py-3 border-t" style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}>
        <button type="button" aria-label="Attach file" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
          <Paperclip size={20} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Add emoji" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
          <Smile size={20} aria-hidden="true" />
        </button>
        <label htmlFor="wc-message" className="sr-only">Type a message</label>
        <input
          id="wc-message"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={keyBlocked ? "Can't send — recipient hasn't set up encryption" : 'Type a message'}
          disabled={keyBlocked}
          aria-describedby={keyBlocked ? 'wc-key-blocked-notice' : undefined}
          className="wc-focus flex-1 rounded-full py-2.5 px-4 text-sm min-w-0 disabled:opacity-60"
          style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || keyBlocked}
          className="wc-focus rounded-full p-2.5 shrink-0 disabled:opacity-40"
          style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </main>
  );
}