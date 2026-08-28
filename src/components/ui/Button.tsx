import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/helpers';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/35 dark:bg-accent dark:text-ink dark:hover:bg-accent/90 dark:focus-visible:ring-accent/35',
        neutral:
          'border border-border bg-white text-ink hover:bg-primary-light/40 focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-hairline-dark dark:bg-surface dark:text-pale-blue dark:hover:bg-accent/10 dark:focus-visible:ring-accent/35',
        ghost:
          'bg-transparent text-ink hover:bg-primary-light/60 focus-visible:ring-2 focus-visible:ring-primary/35 dark:text-pale-blue dark:hover:bg-accent/10 dark:focus-visible:ring-accent/35',
        dangerSolid:
          'bg-danger text-white hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/35 dark:bg-danger-dark dark:text-ink dark:hover:bg-danger-dark/90 dark:focus-visible:ring-danger-dark/35',
        dangerGhost:
          'border border-danger-border bg-white text-danger hover:bg-danger-bg focus-visible:ring-2 focus-visible:ring-danger/35 dark:border-danger-dark/40 dark:bg-surface dark:text-danger-dark dark:hover:bg-danger-dark/10 dark:focus-visible:ring-danger-dark/35',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-10 w-10 p-0',
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
  icon?: LucideIcon;
  iconPosition?: 'leading' | 'trailing';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, icon: Icon, iconPosition = 'leading', isLoading = false, disabled, type = 'button', children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        {...props}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(buttonVariants({ variant, size }), className, 'cursor-pointer disabled:cursor-not-allowed')}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!isLoading && Icon && iconPosition === 'leading' && <Icon className="h-4 w-4" aria-hidden="true" />}
        {children}
        {!isLoading && Icon && iconPosition === 'trailing' && <Icon className="h-4 w-4" aria-hidden="true" />}
      </button>
    );
  }
);

Button.displayName = 'Button';