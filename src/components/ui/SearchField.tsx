import { forwardRef, useId } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from './Icon';

interface SearchFieldProps {
  /** Read by screen readers; the field has no visible label. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ label, value, onChange, placeholder = label, className }, ref) => {
    const id = useId();

    return (
      <div className={cn('focus-ring-within flex min-h-hit items-center gap-2 rounded-full bg-surface-fill px-4', className)}>
        <Icon name="search" size={20} className="text-ink-muted" />
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-2.75 text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';
