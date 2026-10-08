import { cn } from '@/lib/helpers';

/**
 * The track and thumb on their own, for a row that is itself the switch.
 * State is shown two ways — track colour and thumb position — so it doesn't
 * rely on colour alone.
 */
export function ToggleTrack({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full shadow-raised transition-transform',
          checked ? 'translate-x-5.5 bg-on-brand' : 'translate-x-0.5 bg-surface',
        )}
      />
    </span>
  );
}

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // accessible name — announced by screen readers, no visible <label> needed
  disabled?: boolean;
}

/**
 * WAI-ARIA switch pattern: a button with role="switch" + aria-checked,
 * not a checkbox styled to look like a toggle.
 */
export function Toggle({ id, checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type='button'
      id={id}
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // The ::before stretches the touch target to 44px without changing the look.
      className='focus-ring relative inline-flex shrink-0 cursor-pointer rounded-full before:absolute before:inset-x-0 before:-inset-y-2.5 disabled:cursor-not-allowed disabled:opacity-45'
    >
      <ToggleTrack checked={checked} />
    </button>
  );
}
