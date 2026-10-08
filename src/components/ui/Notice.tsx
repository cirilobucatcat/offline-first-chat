import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from './Icon';

interface NoticeProps {
  /** `danger` reports something that went wrong and is announced. `info` states a limit. */
  tone?: 'info' | 'danger';
  children: ReactNode;
  className?: string;
}

/** An inline message inside a card or sheet. The glyph carries the tone, not the colour alone. */
export function Notice({ tone = 'info', children, className }: NoticeProps) {
  const danger = tone === 'danger';
  return (
    <div
      role={danger ? 'alert' : undefined}
      className={cn(
        'flex items-start gap-2 rounded-md px-3 py-2 text-footnote',
        danger ? 'bg-danger-soft text-danger' : 'bg-surface-fill text-ink-muted',
        className,
      )}
    >
      <Icon name={danger ? 'alert' : 'info'} size={16} className="mt-px" />
      <p className="min-w-0">{children}</p>
    </div>
  );
}
