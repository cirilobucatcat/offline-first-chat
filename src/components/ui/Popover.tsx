import { useClickOutside } from '@/hooks/useClickOutside';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const PopoverContext = createContext<{ close: () => void } | null>(null);

function usePopoverClose(): () => void {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('PopoverItem/PopoverDivider must be rendered inside a Popover');
  return ctx.close;
}

interface PopoverProps {
  icon: ReactNode;
  label: string;
  placement?: 'bottom' | 'top';
  align?: 'start' | 'end';
  minWidth?: number;
  children: ReactNode;
}

export function Popover({ icon, label, placement = 'bottom', align = 'end', minWidth = 180, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        className="wc-icon-btn wc-focus rounded-full p-2"
      >
        {icon}
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'absolute z-10 rounded-xl overflow-hidden border bg-white dark:bg-surface border-hairline dark:border-hairline-dark shadow-[0_8px_24px_rgba(15,48,64,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
            align === 'end' ? 'right-0' : 'left-0',
            placement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          ].join(' ')}
          style={{ minWidth }}
        >
          <PopoverContext.Provider value={{ close: () => setOpen(false) }}>{children}</PopoverContext.Provider>
        </div>
      )}
    </div>
  );
}

interface PopoverItemProps {
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

export function PopoverItem({ icon, onClick, disabled = false, tone = 'default', children }: PopoverItemProps) {
  const close = usePopoverClose();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        close();
        onClick();
      }}
      className={`wc-item wc-focus w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left disabled:opacity-50 ${tone === 'danger' ? 'text-error dark:text-error-dark' : 'text-ink dark:text-pale-blue'
        }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function PopoverDivider() {
  return <div role="separator" className="border-t border-hairline dark:border-hairline-dark" />;
}