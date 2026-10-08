import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from './Icon';

interface SegmentedControlProps<T extends string> {
  /** Shown above the control, and its accessible name. */
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Helper text under the control. */
  description?: string;
}

/**
 * A single choice from a few short options. The selected segment carries a
 * check as well as the brand tint, so the choice never rests on colour alone.
 * One tab stop; the arrow keys move and select, as in a native radio group.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, description }: SegmentedControlProps<T>) {
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    else return;

    e.preventDefault();
    onChange(options[next].value);
    groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }

  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-row-title text-ink">
        {label}
      </p>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-surface-fill p-1 [--focus-gap:var(--color-surface-fill)]"
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'focus-ring inline-flex min-h-hit min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-subhead font-semibold transition-colors',
                // The transparent outline is what forced-colours mode draws.
                selected ? 'bg-brand-soft text-brand outline outline-transparent' : 'text-ink-muted hover:text-ink',
              )}
            >
              {selected && <Icon name="check" size={16} />}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
      {description && (
        <p id={`${id}-description`} className="mt-1.5 text-footnote text-ink-muted">
          {description}
        </p>
      )}
    </div>
  );
}
