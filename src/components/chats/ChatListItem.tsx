import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import type { Delivery } from '@/types/chats';
import { Avatar } from '../Avatar';
import { Badge } from '../ui/Badge';
import { DeliveryStatus } from './DeliveryStatus';

interface ChatListItemProps {
  name: string;
  /** Stable key for the avatar tint: the contact's uid, or the conversation id for a group. */
  id: string;
  preview?: ReactNode;
  /** "You", or a member's first name in a group. */
  sender?: string;
  /** Already formatted for the locale. */
  time: string;
  unread?: number;
  /** Delivery state of your own last message. Leave out when the last message is theirs. */
  status?: Delivery;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/** One row in the chat list. No lock on rows: encryption is said once, inside the chat. */
export function ChatListItem({
  name,
  id,
  preview,
  sender,
  time,
  unread = 0,
  status,
  selected = false,
  onClick,
  className,
}: ChatListItemProps) {
  return (
    <li className="group/row">
      <button
        type="button"
        onClick={onClick}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'focus-ring-inset flex h-row w-full cursor-pointer items-center gap-3 pl-4 text-left transition-colors',
          selected ? 'bg-brand-soft' : 'bg-surface hover:bg-surface-fill',
          className,
        )}
      >
        <Avatar name={name} id={id} size="lg" />
        {/* The hairline starts at the text column, not the screen edge. */}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch border-b border-line pr-4 group-last/row:border-transparent">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-row-title text-ink">{name}</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              {status && <DeliveryStatus status={status} />}
              <time className={cn('text-caption tabular-nums', unread > 0 ? 'text-brand' : 'text-ink-muted')}>
                {time}
              </time>
            </span>
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-subhead text-ink-muted">
              {sender && <span className="text-ink">{sender}: </span>}
              {preview}
            </span>
            <span className="inline-flex min-h-5.5 shrink-0 items-center">
              <Badge count={unread} />
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
