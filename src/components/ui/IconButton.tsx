import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/helpers';
import { Icon, type IconName } from './Icon';

const iconButtonVariants = cva(
  'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full outline outline-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        ghost: 'text-ink-muted hover:bg-surface-fill hover:text-ink',
        // Reserved for Send. Never two on one screen.
        primary: 'bg-brand text-on-brand hover:bg-brand-pressed active:bg-brand-pressed',
      },
      size: {
        md: 'size-hit',
        // Only inside a field. The ::before keeps the touch target at 44px.
        sm: 'relative size-9 before:absolute before:-inset-1',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
  VariantProps<typeof iconButtonVariants> {
  icon: IconName;
  /** The accessible name, and the tooltip. */
  label: string;
  spin?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant, size, spin, className, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        {...props}
        type={type}
        className={cn(iconButtonVariants({ variant, size }), className)}
      >
        <Icon name={icon} size={size === 'sm' ? 20 : 24} spin={spin} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
