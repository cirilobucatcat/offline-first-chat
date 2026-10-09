import { cn } from '@/lib/helpers';

interface TypingIndicatorProps {
  /** Who is typing, for the accessible label. */
  name?: string;
  className?: string;
}

// At rest the dots are 70% opaque, which is also what reduced motion shows.
const DOT = 'size-1.75 rounded-full bg-ink-muted opacity-70 outline outline-transparent motion-safe:animate-typing-dot';

// Each dot starts a little after the one before, so the rise travels along the row as a wave.
// Set inline: the animate class is an `animation` shorthand, which resets a delay set by another class.
const DOT_DELAYS_MS = [0, 160, 320];

/**
 * Three dots in an incoming bubble, at the bottom of the thread. Show it only
 * while connected: typing is never queued or replayed.
 */
export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div role="status" aria-label={`${name ?? 'Someone'} is typing`} className={cn('mt-3 flex items-end', className)}>
      {/* As tall as a one-line bubble. */}
      <div aria-hidden="true" className="inline-flex h-8.75 items-center gap-1 rounded-bubble bg-bubble-in px-3.5 shadow-bubble">
        {DOT_DELAYS_MS.map((delay) => (
          <span key={delay} className={DOT} style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
