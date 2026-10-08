import { useEffect, useRef, useState } from 'react';
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
}

export function MessageArea({ conversation, onBack, onAddPeople, onCreateGroupWithUser, mobileHidden = false }: MessageAreaProps) {
  const { user } = useAuth();
  const { privateKey } = useMyIdentityKey();
  const { timestampFormat, readReceipts } = useChatPreferences();
  const other = conversation && user ? getOtherParticipant(conversation, user.uid) : null;
  const { messages } = useMessages(conversation?.id ?? null, other?.uid ?? null);
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
      <main className={cn(mobileHidden ? 'hidden' : 'flex', 'flex-1 items-center justify-center bg-canvas px-4 md:flex')}>
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
    <p role='alert' className='flex items-start gap-2 bg-danger-soft px-4 py-2 text-footnote text-danger'>
      <Icon name='alert' size={16} className='mt-px' />
      {sendErrorKind === 'no-key' ? noKeyNotice : 'Message not sent. Try again.'}
    </p>
  ) : undefined;

  return (
    <main
      className={cn(mobileHidden ? 'hidden' : 'flex', 'min-w-0 flex-1 flex-col bg-canvas md:flex')}
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

      <div className='wc-scroll flex-1 overflow-y-auto px-3 pb-3'>
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
