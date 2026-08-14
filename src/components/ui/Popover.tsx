import { useClickOutside } from '@/hooks/useClickOutside';
import { COLOR } from '@/lib/constants';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const PopoverContext = createContext<{ close: () => void } | null>(null);

function usePopoverClose(): () => void {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('PopoverItem/PopoverDivider must be rendered inside a Popover');
  return ctx.close;
}

interface PopoverProps {
  icon: ReactNode; // trigger icon — caller supplies size + aria-hidden
  label: string; // aria-label for the trigger button
  placement?: 'bottom' | 'top'; // 'top' for triggers near the bottom of the viewport
  align?: 'start' | 'end';
  minWidth?: number;
  children: ReactNode; // PopoverItem / PopoverDivider elements
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
            'absolute z-10 rounded-xl overflow-hidden',
            align === 'end' ? 'right-0' : 'left-0',
            placement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          ].join(' ')}
          style={{
            backgroundColor: COLOR.white,
            border: `1px solid ${COLOR.hairline}`,
            boxShadow: '0 8px 24px rgba(15,48,64,0.12)',
            minWidth,
          }}
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
      className="wc-item wc-focus w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left disabled:opacity-50"
      style={{ color: tone === 'danger' ? COLOR.error : COLOR.ink }}
    >
      {icon}
      {children}
    </button>
  );
}

export function PopoverDivider() {
  return <div role="separator" style={{ borderTop: `1px solid ${COLOR.hairline}` }} />;
}