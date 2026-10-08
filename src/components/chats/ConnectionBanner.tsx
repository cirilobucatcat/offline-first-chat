import { useEffect, useState } from 'react';
import { cn } from '@/lib/helpers';
import type { NetworkStatus } from '@/hooks/useNetworkStatus';
import { Icon } from '../ui/Icon';

interface ConnectionBannerProps {
  state: NetworkStatus;
  className?: string;
}

/**
 * The strip under the chat list's top bar. Offline is a state, not an error,
 * and it is not dismissible. Online renders nothing: there is no "back online"
 * message, because the queued messages turning into checks is the confirmation.
 */
export function ConnectionBanner({ state, className }: ConnectionBannerProps) {
  // Syncing shows only after a second, so a brief reconnect stays silent.
  const [syncingIsSlow, setSyncingIsSlow] = useState(false);
  useEffect(() => {
    if (state !== 'syncing') return;
    const timer = setTimeout(() => setSyncingIsSlow(true), 1000);
    return () => {
      clearTimeout(timer);
      setSyncingIsSlow(false);
    };
  }, [state]);

  if (state === 'online') return null;
  if (state === 'syncing' && !syncingIsSlow) return null;

  const offline = state === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-10 shrink-0 items-center gap-2 px-4 py-2 text-footnote',
        offline ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand',
        className,
      )}
    >
      {offline ? (
        <>
          <Icon name="cloud-off" size={20} />
          <span>
            <strong className="font-semibold">You're offline.</strong> You can keep writing — messages send when
            you're back.
          </span>
        </>
      ) : (
        <>
          <Icon name="sync" size={20} spin />
          <span>Syncing…</span>
        </>
      )}
    </div>
  );
}
