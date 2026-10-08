import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/helpers';
import { Icon, type IconName } from './Icon';

const buttonVariants = cva(
  // The transparent outline is what forced-colours mode draws around the fill.
  'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline outline-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        // One per screen or sheet.
        primary: 'bg-brand text-on-brand hover:bg-brand-pressed active:bg-brand-pressed',
        secondary: 'bg-surface-fill text-ink hover:bg-line',
        ghost: 'bg-transparent text-brand hover:bg-brand-soft',
        // Only for what cannot be undone and reaches other people's devices.
        danger: 'bg-danger text-on-danger',
      },
      size: {
        md: 'h-hit px-5 text-row-title',
        // Only inside cards and banners. The ::before keeps the touch target at 44px.
        sm: 'relative h-9 px-4 text-subhead before:absolute before:inset-x-0 before:-inset-y-1',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  icon?: IconName;
  iconPosition?: 'leading' | 'trailing';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, icon, iconPosition = 'leading', isLoading = false, disabled, type = 'button', children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        {...props}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(buttonVariants({ variant, size, block }), className)}
      >
        {isLoading && <Icon name="sync" size={20} spin />}
        {!isLoading && icon && iconPosition === 'leading' && <Icon name={icon} size={20} />}
        {children}
        {!isLoading && icon && iconPosition === 'trailing' && <Icon name={icon} size={20} />}
      </button>
    );
  }
);

Button.displayName = 'Button';
