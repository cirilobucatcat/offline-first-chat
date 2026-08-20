import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Global connectivity banner. Renders nothing while online — only appears
 * when there's something the person needs to know about message delivery.
 *
 * Mount once, near the top of the app shell (e.g. in your root Layout),
 * above routed content, so it's visible regardless of which screen is open.
 */
export function NetworkStatusBanner() {
  const status = useNetworkStatus();

  if (status === 'online') return null;

  const isOffline = status === 'offline';

  return (
    <div
      role='status'
      aria-live='polite'
      className={`flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
        isOffline ? 'bg-ink text-pale-blue' : 'bg-primary text-pale-blue'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className='h-4 w-4 shrink-0' aria-hidden='true' />
          <span>
            You're offline. New messages will send when you're back online.
          </span>
        </>
      ) : (
        <>
          <RefreshCw
            className='h-4 w-4 shrink-0 motion-safe:animate-spin'
            aria-hidden='true'
          />
          <span>Back online — sending your messages…</span>
        </>
      )}
    </div>
  );
}
