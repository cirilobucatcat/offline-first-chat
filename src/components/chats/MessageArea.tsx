import { useEffect, useRef, useState, type Ref } from 'react';
import {
  sendMessage,
  markConversationRead,
  isMessageReadByAll,
  formatMessageTime,
  getDeliveryStatus,
  groupMessagesByDay,
  groupMessagesIntoRuns,
  getConversationTitle,
  getOtherParticipant,
  PeerKeyMissingError,
  type ParticipantSeed,
} from '@/lib/chat';
import { cn } from '@/lib/helpers';
import type { Conversation } from '@/types/chats';
import { Avatar } from '../Avatar';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePeerKeyStatus } from '@/hooks/usePeerKeyStatus';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { Popover, PopoverItem } from '../ui/Popover';
import { useMyIdentityKey } from '@/context/IdentityContext';
import { useChatPreferences } from '@/context/ChatPreferencesContext';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { MessageBubble } from './MessageBubble';
import { SystemNotice } from './SystemNotice';

interface MessageAreaProps {
  conversation: Conversation | null;
  onBack: () => void;
  onAddPeople: (conversation: Conversation) => void;
  onCreateGroupWithUser: (participant: ParticipantSeed) => void;
  mobileHidden?: boolean;
  /** The thread pane, so focus can move to it when a chat opens. */
  paneRef?: Ref<HTMLElement>;
}

export function MessageArea({ conversation, onBack, onAddPeople, onCreateGroupWithUser, mobileHidden = false, paneRef }: MessageAreaProps) {
  const { user } = useAuth();
  const { privateKey } = useMyIdentityKey();
  const { timestampFormat, readReceipts } = useChatPreferences();
  const other = conversation && user ? getOtherParticipant(conversation, user.uid) : null;
  const { messages, loading } = useMessages(conversation?.id ?? null, other?.uid ?? null);
  const networkStatus = useNetworkStatus();
  // `other` is null in a group, so groups never subscribe.
  const peerKeyStatus = usePeerKeyStatus(other?.uid ?? null);
  const [draft, setDraft] = useState('');
  // Kept with the conversation it happened in, so it doesn't follow you to another chat.
  const [sendError, setSendError] = useState<{ conversationId: string; kind: 'no-key' | 'failed' } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const title = conversation && user ? getConversationTitle(conversation, user.uid) : '';

  const conversationId = conversation?.id ?? null;
  const myUid = user?.uid ?? null;
  const myUnread = conversation && myUid ? (conversation.unreadCount?.[myUid] ?? 0) : 0;
  useEffect(() => {
    if (!conversationId || !myUid) return;
    if (myUnread === 0) return;
    markConversationRead(conversationId, myUid, { sendReadReceipt: readReceipts });
  }, [conversationId, myUnread, myUid, readReceipts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // Screen readers hear a message that arrives while the chat is open. The history
  // that loads with the chat is not read out, and neither are your own messages.
  const liveRef = useRef<HTMLParagraphElement>(null);
  const announced = useRef<{ conversationId: string | null; lastId: string | null; primed: boolean }>({
    conversationId: null,
    lastId: null,
    primed: false,
  });
  const lastMessage = messages[messages.length - 1];
  const lastId = lastMessage?.id ?? null;
  const lastText = lastMessage?.displayText ?? '';
  const lastSenderId = lastMessage?.senderId ?? null;
  const lastSenderName = (lastSenderId && conversation?.participantInfo[lastSenderId]?.name) || 'Unknown';
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    if (loading || announced.current.conversationId !== conversationId) {
      announced.current = { conversationId, lastId: null, primed: false };
      live.textContent = '';
      if (loading) return;
    }
    if (!announced.current.primed) {
      announced.current.lastId = lastId;
      announced.current.primed = true;
      return;
    }
    if (!lastId || lastId === announced.current.lastId) return;
    if (lastSenderId === myUid) {
      announced.current.lastId = lastId;
      return;
    }
    // An encrypted message has no text until it is decrypted; wait for it.
    if (!lastText) return;
    announced.current.lastId = lastId;
    live.textContent = `${lastSenderName}: ${lastText}`;
  }, [conversationId, loading, lastId, lastText, lastSenderId, lastSenderName, myUid]);

  // Held only for a missing key, which no amount of waiting on this device fixes. Never for being offline.
  const sendHeld = peerKeyStatus === 'missing';
  const sendErrorKind = sendError && sendError.conversationId === conversationId ? sendError.kind : null;
  const noKeyNotice = `${title} hasn't set up encryption yet. You can send messages once they have.`;

  async function handleSend() {
    if (!conversation || !user || !draft.trim() || sendHeld) return;
    const text = draft;
    setDraft('');
    setSendError(null);
    try {
      await sendMessage(conversation.id, user.uid, conversation.participants, text, {
        isGroup: conversation.isGroup,
        myPrivateKey: privateKey,
      });
    } catch (err) {
      console.error('Failed to send message', err);
      setSendError({
        conversationId: conversation.id,
        kind: err instanceof PeerKeyMissingError ? 'no-key' : 'failed',
      });
      // Put the text back, unless something new was typed in the meantime.
      setDraft((current) => current || text);
    }
  }

  if (!conversation) {
    return (
      <main
        ref={paneRef}
        tabIndex={-1}
        className={cn(mobileHidden ? 'hidden' : 'flex', 'flex-1 items-center justify-center bg-canvas px-4 outline-none md:flex')}
      >
        <p className='text-center text-body text-ink-muted'>Select a chat to start messaging.</p>
      </main>
    );
  }

  const offline = networkStatus === 'offline';
  const memberCount = conversation.participants.length;
  const days = groupMessagesByDay(messages);

  const composerNotice = sendHeld ? (
    <p role='status' className='flex items-start gap-2 px-4 pt-2 text-footnote text-ink-muted'>
      <Icon name='info' size={16} className='mt-px' />
      {noKeyNotice}
    </p>
  ) : sendErrorKind ? (
    <Notice tone='danger' className='rounded-none px-4'>
      {sendErrorKind === 'no-key' ? noKeyNotice : 'Message not sent. Try again.'}
    </Notice>
  ) : undefined;

  return (
    <main
      ref={paneRef}
      tabIndex={-1}
      className={cn(mobileHidden ? 'hidden' : 'flex', 'min-w-0 flex-1 flex-col bg-canvas outline-none md:flex')}
      aria-label={`Conversation with ${title}`}
    >
      <ChatHeader
        name={title}
        id={other?.uid ?? conversation.id}
        subtitle={conversation.isGroup ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : undefined}
        connection={networkStatus}
        onBack={onBack}
        actions={
          <Popover icon='more' label='Chat options'>
            {conversation.isGroup ? (
              <PopoverItem icon='user-plus' onClick={() => onAddPeople(conversation)}>
                Add people
              </PopoverItem>
            ) : (
              other && (
                <PopoverItem icon='users' onClick={() => onCreateGroupWithUser(other)}>
                  Create group with {other.name.split(' ')[0]}
                </PopoverItem>
              )
            )}
          </Popover>
        }
      />

      {/* Focusable, so the thread can be scrolled from the keyboard. */}
      <div
        tabIndex={0}
        role='region'
        aria-label='Messages'
        className='wc-scroll focus-ring-inset flex-1 overflow-y-auto px-3 pb-3'
      >
        {/* Said once, at the top. Groups are not encrypted, so they say that instead. */}
        {conversation.isGroup ? (
          <SystemNotice kind='info'>Messages in this group are not end-to-end encrypted.</SystemNotice>
        ) : (
          <SystemNotice kind='encryption'>
            Messages in this chat stay between you and the people in it. Not even WeakChat can read them.
          </SystemNotice>
        )}
        {days.map((day, di) => (
          <div key={`${day.label}-${di}`}>
            <SystemNotice kind='date'>{day.label}</SystemNotice>
            {/* Bubbles stay direct children of the day, because a bubble's spacing depends on its siblings. */}
            {groupMessagesIntoRuns(day.items).flatMap((run) =>
              run.map((m, i) => {
                const mine = m.senderId === user?.uid;
                const position = run.length === 1 ? 'single' : i === 0 ? 'first' : i === run.length - 1 ? 'last' : 'middle';
                const groupIncoming = conversation.isGroup && !mine;
                const senderName = conversation.participantInfo[m.senderId]?.name ?? 'Unknown';
                return (
                  <MessageBubble
                    key={m.id}
                    direction={mine ? 'out' : 'in'}
                    position={position}
                    time={m.createdAt ? formatMessageTime(m.createdAt, timestampFormat === '12h') : undefined}
                    dateTime={m.createdAt?.toDate().toISOString()}
                    speaker={mine ? 'You' : senderName}
                    status={
                      mine
                        ? getDeliveryStatus({
                            pending: !m.createdAt,
                            read: isMessageReadByAll(conversation, m.senderId, m),
                            offline,
                          })
                        : undefined
                    }
                    sender={groupIncoming ? senderName : undefined}
                    avatar={groupIncoming ? <Avatar name={senderName} id={m.senderId} size='sm' /> : undefined}
                    indent={groupIncoming}
                  >
                    {m.displayText}
                  </MessageBubble>
                );
              }),
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <p ref={liveRef} aria-live='polite' className='sr-only' />

      <Composer
        value={draft}
        onChange={(value) => {
          setDraft(value);
          setSendError(null);
        }}
        onSend={handleSend}
        offline={offline}
        held={sendHeld}
        notice={composerNotice}
      />
    </main>
  );
}
