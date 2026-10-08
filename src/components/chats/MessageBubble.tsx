import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import type { Delivery } from '@/types/chats';
import { DeliveryStatus } from './DeliveryStatus';

type Direction = 'in' | 'out';
type Position = 'single' | 'first' | 'middle' | 'last';

// Free corners are radius-bubble; they tighten to radius-xs on the sender's side
// where a bubble joins the rest of its run.
const JOINED: Record<Direction, Record<Position, string>> = {
  in: {
    single: '',
    first: 'rounded-bl-xs',
    middle: 'rounded-tl-xs rounded-bl-xs',
    last: 'rounded-tl-xs',
  },
  out: {
    single: '',
    first: 'rounded-br-xs',
    middle: 'rounded-tr-xs rounded-br-xs',
    last: 'rounded-tr-xs',
  },
};

interface MessageBubbleProps {
  direction: Direction;
  /** Place in a run of consecutive messages from one sender. */
  position?: Position;
  /** Already formatted for the locale, e.g. "18:42". */
  time?: string;
  /**
   * Outgoing only. `failed` is left out: the app has no failed-write state,
   * so there is nothing to retry.
   */
  status?: Exclude<Delivery, 'failed'>;
  /** Group chats: shown on the first incoming bubble of a run. */
  sender?: string;
  /** Group chats: an `<Avatar size="sm" />`, shown beside the last bubble of a run. */
  avatar?: ReactNode;
  /** Reserve the avatar column on every incoming bubble so the text lines up. */
  indent?: boolean;
  children: ReactNode;
  className?: string;
}

/** Room to keep free on the last line for the time and status, in rem. */
function metaWidth(time: string | undefined, hasStatus: boolean) {
  const px = (time ? time.length * 7 : 0) + 10 + (hasStatus ? 20 : 0);
  return `${px / 16}rem`;
}

export function MessageBubble({
  direction,
  position = 'single',
  time,
  status,
  sender,
  avatar,
  indent = false,
  children,
  className,
}: MessageBubbleProps) {
  const out = direction === 'out';
  const startsRun = position === 'first' || position === 'single';
  const endsRun = position === 'last' || position === 'single';
  const shownStatus = out ? status : undefined;
  const hasAvatarColumn = !out && (avatar !== undefined || indent);

  return (
    <div
      className={cn(
        'flex items-end gap-2 first:mt-0',
        startsRun ? 'mt-3' : 'mt-0.5',
        out && 'justify-end',
        className,
      )}
    >
      {hasAvatarColumn && <div className="flex w-7 shrink-0">{endsRun ? avatar : null}</div>}
      <div className={cn('flex min-w-0 max-w-bubble-max flex-col', out ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative max-w-full rounded-bubble px-3 pt-1.5 pb-1.75 text-body wrap-anywhere',
            out ? 'bg-bubble-out text-on-bubble-out' : 'bg-bubble-in text-ink shadow-bubble',
            JOINED[direction][position],
          )}
        >
          {!out && sender && startsRun && (
            <div className="mb-0.5 text-footnote font-semibold text-brand">{sender}</div>
          )}
          <div className="whitespace-pre-wrap">
            {children}
            <span aria-hidden="true" className="inline-block h-px" style={{ width: metaWidth(time, shownStatus !== undefined) }} />
          </div>
          <span
            className={cn(
              'absolute right-3 bottom-1.25 inline-flex items-center gap-1 whitespace-nowrap text-caption tabular-nums',
              out ? 'text-bubble-out-meta' : 'text-ink-muted',
            )}
          >
            {time && <time>{time}</time>}
            {shownStatus && <DeliveryStatus status={shownStatus} tone="bubble" />}
          </span>
        </div>
      </div>
    </div>
  );
}
