import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

const COLOR = {
  white: '#FFFFFF',
  ink: '#0F3040',
  hairline: 'rgba(13, 71, 161, 0.14)',
};

interface ModalProps {
  titleId: string;
  title: string;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(15, 48, 64, 0.45)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ maxWidth, maxHeight: '80vh', backgroundColor: COLOR.white, fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: COLOR.hairline }}>
          <h2 id={titleId} className="text-lg font-semibold" style={{ color: COLOR.ink }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="wc-icon-btn wc-focus rounded-full p-1.5">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: COLOR.hairline }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}