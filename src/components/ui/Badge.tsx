interface BadgeProps {
  /** Unread count. 0 renders nothing; over 999 reads "999+". */
  count?: number;
}

/** The unread counter on a chat row. Never put words in it. */
export function Badge({ count = 0 }: BadgeProps) {
  if (!count) return null;

  return (
    <span className="inline-flex h-5.5 min-w-5.5 shrink-0 items-center justify-center rounded-full bg-brand px-1.75 text-caption font-bold tabular-nums text-on-brand">
      {count > 999 ? '999+' : count}
      <span className="sr-only"> unread</span>
    </span>
  );
}
