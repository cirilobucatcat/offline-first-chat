import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from '../ui/Icon';

interface SystemNoticeProps {
  /**
   * `date` is a day divider, `info` an event or a plain statement, and
   * `encryption` the card at the top of a direct chat. Never use `encryption`
   * in a group chat: group messages are not encrypted.
   */
  kind?: 'date' | 'info' | 'encryption';
  /** `encryption` only: the card title. */
  title?: string;
  /** One sentence. Notices are not messages: no time, no status. */
  children: ReactNode;
}

export function SystemNotice({ kind = 'info', title = 'End-to-end encrypted', children }: SystemNoticeProps) {
  if (kind === 'encryption') {
    return (
      <div className="my-3 flex justify-center">
        <div
          role="note"
          className="flex max-w-85 items-start gap-3 rounded-md bg-surface-raised p-4 text-footnote text-ink-muted shadow-bubble"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
          >
            <Icon name="lock" size={20} />
          </span>
          <div>
            <div className="mb-0.5 text-subhead font-semibold text-ink">{title}</div>
            <div>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 flex justify-center">
      <div
        role={kind === 'date' ? 'separator' : 'note'}
        className={cn(
          'inline-flex max-w-[86%] items-center rounded-full bg-surface-raised px-3 py-1 text-center text-footnote text-ink-muted shadow-bubble',
          kind === 'date' && 'font-semibold',
        )}
      >
        {children}
      </div>
    </div>
  );
}
