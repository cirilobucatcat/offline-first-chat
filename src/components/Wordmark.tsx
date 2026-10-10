import { Link } from 'react-router';
import { cn } from '@/lib/helpers';

/** The mark and the name, linking home. There is no logo: the name is set in Outfit bold. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      // The ::before extends the 40px mark to a 44px touch target.
      className={cn(
        'focus-ring relative inline-flex items-center gap-3 self-start rounded-md before:absolute before:inset-x-0 before:-inset-y-0.5',
        className,
      )}
    >
      <img src="/favicon.svg" alt="" width={40} height={40} className="size-10" />
      <span className="text-title text-ink">WeakChat</span>
    </Link>
  );
}
