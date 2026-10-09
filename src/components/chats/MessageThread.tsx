import { memo, useMemo } from 'react';
import {
  isMessageReadByAll,
  formatMessageTime,
  getDeliveryStatus,
  groupMessagesByDay,
  groupMessagesIntoRuns,
  runPosition,
} from '@/lib/chat';
import type { Conversation } from '@/types/chats';
import type { DisplayMessage } from '@/hooks/useMessages';
import { Avatar } from '../Avatar';
import { MessageBubble } from './MessageBubble';
import { SystemNotice } from './SystemNotice';

interface MessageThreadProps {
  conversation: Conversation;
  messages: DisplayMessage[];
  myUid: string | null;
  offline: boolean;
  /** True for the 12-hour timestamp format. */
  hour12: boolean;
}

/**
 * The encryption notice, then the messages grouped by day and run. Memoised so
 * typing in the composer does not regroup and re-render the whole thread.
 */
export const MessageThread = memo(function MessageThread({
  conversation,
  messages,
  myUid,
  offline,
  hour12,
}: MessageThreadProps) {
  const days = useMemo(() => groupMessagesByDay(messages), [messages]);

  return (
    <>
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
              const mine = m.senderId === myUid;
              const groupIncoming = conversation.isGroup && !mine;
              const senderName = conversation.participantInfo[m.senderId]?.name ?? 'Unknown';
              return (
                <MessageBubble
                  key={m.id}
                  direction={mine ? 'out' : 'in'}
                  position={runPosition(i, run.length)}
                  time={m.createdAt ? formatMessageTime(m.createdAt, hour12) : undefined}
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
    </>
  );
});
