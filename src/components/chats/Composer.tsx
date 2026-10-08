import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Shows the "saved, sends when you reconnect" hint. Send stays enabled. */
  offline?: boolean;
  /**
   * Hold Send for a reason that is not the network, such as a peer with no
   * encryption key. Never set this because the app is offline.
   */
  held?: boolean;
  /** A line above the bar that explains `held` or reports a send that did not go. */
  notice?: ReactNode;
  className?: string;
}

/** The message bar at the bottom of a thread. Enter sends; Shift+Enter adds a line. */
export function Composer({ value, onChange, onSend, offline = false, held = false, notice, className }: ComposerProps) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !held;

  // Grow with the text, up to the max height set on the textarea.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSend) onSend();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter that confirms an IME candidate must not send.
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (canSend) onSend();
  }

  return (
    <form onSubmit={handleSubmit} className={cn('border-t border-line bg-surface', className)}>
      {notice}
      {offline && (
        <p role="status" className="flex items-center gap-1.5 px-4 pt-2 text-footnote text-ink-muted">
          <Icon name="clock" size={16} />
          Offline — messages are saved and send when you reconnect.
        </p>
      )}
      <div className="flex items-end gap-1 p-2">
        <label className="flex min-h-hit min-w-0 flex-1 items-end rounded-bubble bg-surface-fill px-4 focus-within:shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]">
          <span className="sr-only">Message</span>
          <textarea
            ref={fieldRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            className="max-h-33 min-w-0 flex-1 resize-none bg-transparent py-2.75 text-body text-ink outline-none placeholder:text-ink-muted"
          />
        </label>
        <IconButton
          type="submit"
          icon="send"
          label={offline ? 'Send when online' : 'Send'}
          variant="primary"
          disabled={!canSend}
        />
      </div>
    </form>
  );
}
