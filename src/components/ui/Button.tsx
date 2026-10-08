import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/helpers';
import { Icon, type IconName } from './Icon';

const buttonVariants = cva(
  'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45',
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
        // Only inside cards and banners.
        sm: 'h-9 px-4 text-subhead',
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
