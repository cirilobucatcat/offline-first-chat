/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';

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
      className='fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-ink px-4 py-3 text-pale-blue shadow-lg'
    >
      <span className='text-sm'>
        {needRefresh
          ? 'A new version of WeakChat is ready.'
          : 'WeakChat is ready to work offline.'}
      </span>

      {needRefresh && (
        <Button
          variant='primary'
          size='sm'
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </Button>
      )}

      <button
        onClick={dismiss}
        aria-label='Dismiss'
        className='text-pale-blue/70 hover:text-pale-blue'
      >
        ✕
      </button>
    </div>
  );
}
