import { COLOR } from '@/lib/constants';

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
      className='wc-focus relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      style={{
        width: 44,
        height: 26,
        backgroundColor: checked ? COLOR.primary : COLOR.white,
        border: `1.5px solid ${checked ? COLOR.primary : COLOR.border}`,
      }}
    >
      <span
        aria-hidden='true'
        className='inline-block rounded-full shadow transition-transform'
        style={{
          width: 18,
          height: 18,
          backgroundColor: checked ? COLOR.white : COLOR.muted,
          transform: checked ? 'translateX(21px)' : 'translateX(3px)',
        }}
      />
    </button>
  );
}