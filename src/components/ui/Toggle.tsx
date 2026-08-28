interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // accessible name — announced by screen readers, no visible <label> needed
  disabled?: boolean;
}

/**
 * WAI-ARIA switch pattern: a button with role="switch" + aria-checked,
 * not a checkbox styled to look like a toggle. State is shown two ways —
 * track color AND thumb position — so it doesn't rely on color alone.
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
      className={`wc-focus relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-primary dark:bg-accent' : 'bg-border dark:bg-mist/25'
        }`}
    >
      <span
        aria-hidden='true'
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
      />
    </button>
  );
}