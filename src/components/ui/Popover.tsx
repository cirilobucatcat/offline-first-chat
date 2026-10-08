import { useClickOutside } from '@/hooks/useClickOutside';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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

/** A menu button. The arrow keys move through the items; Escape and Tab close it. */
export function Popover({ icon, label, placement = 'bottom', align = 'end', minWidth = 180, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  // Focus goes back to the button, so it is never left on an item that no longer exists.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();

    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  function handleMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Tab') {
      // Not prevented: Tab then carries on from the button.
      close();
      return;
    }
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'));
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (e.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;

    e.preventDefault();
    items[next].focus();
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <IconButton
        ref={triggerRef}
        icon={icon}
        label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' || open) return;
          e.preventDefault();
          setOpen(true);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      />

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute z-10 overflow-hidden rounded-md bg-surface-raised py-1 shadow-float',
            align === 'end' ? 'right-0' : 'left-0',
            placement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          )}
          style={{ minWidth }}
        >
          <PopoverContext.Provider value={{ close }}>{children}</PopoverContext.Provider>
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
      // Reached with the arrow keys; the menu button is the one tab stop.
      tabIndex={-1}
      disabled={disabled}
      onClick={() => {
        // Closed first, so anything the item opens sees the menu button as what opened it.
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
