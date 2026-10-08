import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from './IconButton';

const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex]';

interface ModalProps {
  titleId: string;
  title: string | ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ titleId, title, onClose, children, footer, maxWidth = 420 }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Read while rendering, before anything inside the dialog takes focus for itself.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Focus moves into the dialog when it opens and back to what opened it when it closes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      const field = dialog.querySelector<HTMLElement>('input:not([readonly]), textarea, select');
      (field ?? dialog).focus();
    }
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [opener]);

  // Tab stays inside the dialog: the page behind it is not reachable while it is open.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const dialog = e.currentTarget;
    const stops = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
    if (stops.length === 0) {
      e.preventDefault();
      return;
    }
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialog)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    // A bottom sheet on a phone, a centred dialog from md up.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim md:items-center md:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        // dvh, so the sheet stays clear of a phone's on-screen keyboard.
        className="flex max-h-[80dvh] w-full flex-col overflow-hidden rounded-t-sheet bg-surface-raised text-ink shadow-float outline-none [--focus-gap:var(--color-surface-raised)] motion-safe:animate-sheet-up md:rounded-sheet md:motion-safe:animate-bubble-in"
        style={{ maxWidth }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-2 pr-2 pl-5">
          <h2 id={titleId} className="text-headline text-ink">
            {title}
          </h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>

        {footer && <div className="shrink-0 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
