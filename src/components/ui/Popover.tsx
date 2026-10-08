import { useClickOutside } from '@/hooks/useClickOutside';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

const PopoverContext = createContext<{ close: () => void } | null>(null);

function usePopoverClose(): () => void {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('PopoverItem/PopoverDivider must be rendered inside a Popover');
  return ctx.close;
}

interface PopoverProps {
  icon: IconName;
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
      <IconButton
        icon={icon}
        label={label}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      />

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-10 overflow-hidden rounded-md bg-surface-raised py-1 shadow-float',
            align === 'end' ? 'right-0' : 'left-0',
            placement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          )}
          style={{ minWidth }}
        >
          <PopoverContext.Provider value={{ close: () => setOpen(false) }}>{children}</PopoverContext.Provider>
        </div>
      )}
    </div>
  );
}

interface PopoverItemProps {
  icon: IconName;
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
      className={cn(
        'focus-ring-inset flex min-h-hit w-full cursor-pointer items-center gap-3 px-4 text-left text-body hover:bg-surface-fill disabled:cursor-not-allowed disabled:opacity-45',
        tone === 'danger' ? 'text-danger' : 'text-ink',
      )}
    >
      <Icon name={icon} size={20} className={tone === 'danger' ? undefined : 'text-ink-muted'} />
      {children}
    </button>
  );
}

export function PopoverDivider() {
  return <div role="separator" className="my-1 border-t border-line" />;
}