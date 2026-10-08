import { useEffect, type ReactNode } from 'react';
import { IconButton } from './IconButton';

interface ModalProps {
  titleId: string;
  title: string | ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ titleId, title, onClose, children, footer, maxWidth = 420 }: ModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
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

  return (
    // A bottom sheet on a phone, a centred dialog from md up.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim md:items-center md:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full flex-col overflow-hidden rounded-t-sheet bg-surface-raised text-ink shadow-float [--focus-gap:var(--color-surface-raised)] motion-safe:animate-sheet-up md:rounded-sheet md:motion-safe:animate-bubble-in"
        style={{ maxWidth, maxHeight: '80vh' }}
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