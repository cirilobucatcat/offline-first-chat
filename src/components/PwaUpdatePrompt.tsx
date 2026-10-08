/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

/**
 * Surfaces two service-worker lifecycle events the person should actually
 * see: the app shell has finished precaching (safe to go offline now), and
 * a new build is installed and waiting.
 *
 * Nothing swaps automatically. Same principle as the E2EE send path:
 * visible, explicit state changes — never a silent reload under someone
 * mid-conversation.
 */
export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Long-lived open tabs should still get offered updates
      // periodically, not just on their next hard navigation.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role='status'
      aria-live='polite'
      // The transparent outline is the toast's edge in forced-colours mode.
      className='fixed bottom-4 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-md bg-surface-raised py-2 pr-2 pl-4 text-subhead text-ink shadow-float outline outline-transparent [--focus-gap:var(--color-surface-raised)]'
    >
      <span className='min-w-0'>
        {needRefresh
          ? 'A new version of WeakChat is ready.'
          : 'WeakChat is ready to work offline.'}
      </span>

      {needRefresh && (
        <Button
          variant='secondary'
          size='sm'
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </Button>
      )}

      <IconButton icon='close' label='Dismiss' size='sm' onClick={dismiss} />
    </div>
  );
}
