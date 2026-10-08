import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Avatar } from '../Avatar';

interface PersonRowProps {
  name: string;
  /** The person's uid, for the avatar tint. */
  id: string;
  email: string;
  onClick: () => void;
  /** Shown at the end of the row, such as a selection mark. */
  trailing?: ReactNode;
  className?: string;
}

/** A person found by search, in the chat list or the group sheet. */
export function PersonRow({ name, id, email, onClick, trailing, className }: PersonRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'focus-ring-inset flex h-row w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors hover:bg-surface-fill',
          className,
        )}
      >
        <Avatar name={name} id={id} size="lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-row-title text-ink">{name}</span>
          <span className="truncate text-subhead text-ink-muted">{email}</span>
        </span>
        {trailing}
      </button>
    </li>
  );
}
