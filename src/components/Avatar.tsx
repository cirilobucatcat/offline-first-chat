import { colorIndexForId } from '@/lib/chat';
import { cn } from '@/lib/helpers';
import { getInitials } from '@/lib/users';

// xs 16px, sm 28px, md 40px, lg 54px, xl 88px at the default text size.
const SIZES = {
  xs: 'size-4 text-[0.5625rem]',
  sm: 'size-7 text-[0.6875rem]',
  md: 'size-10 text-[0.9375rem]',
  lg: 'size-13.5 text-[1.3125rem]',
  xl: 'size-22 text-[2.0625rem]',
};

// The tints carry no meaning. Never reuse them for status.
const TINTS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'];

interface AvatarProps {
  /** Display name of the person or chat. Initials come from its first and last word. */
  name: string;
  /** Stable key for the tint, so a contact keeps their colour. Defaults to the name. */
  id?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Decorative: every place that shows an avatar also shows the name beside it. */
export function Avatar({ name, id, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-[0.01em] text-on-avatar',
        SIZES[size],
        TINTS[colorIndexForId(id ?? name, TINTS.length)],
        className,
      )}
    >
      {size === 'xs' ? initials.slice(0, 1) : initials}
    </span>
  );
}
