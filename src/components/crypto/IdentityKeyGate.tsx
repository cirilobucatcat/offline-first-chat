import { useState, type ReactNode } from 'react';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { IdentityKeyProvider } from '@/context/IdentityContext';
import { logOut } from '@/lib/account';
import { formatLinkCode } from '@/lib/crypto/deviceLink';
import { Button } from '../ui/Button';
import { LoadingScreen } from '../ui/LoadingScreen';
import { Notice } from '../ui/Notice';

/**
 * Wraps authenticated routes and blocks rendering until this device has an
 * E2EE identity key ready. Shares ProtectedRoute's loading screen.
 */
export function IdentityKeyGate({ children }: { children: ReactNode }) {
  const state = useIdentityKeys();

  if (state.phase === 'loading' || state.phase === 'idle') {
    return <LoadingScreen>Setting up encryption…</LoadingScreen>;
  }

  if (state.phase === 'needs-link') {
    return (
      <NeedsLinkScreen
        code={state.code}
        expired={state.expired}
        onRefresh={state.refresh}
        onSignOut={() => {
          // Delete the pending session while this device is still signed in.
          state.cancel();
          void logOut();
        }}
      />
    );
  }

  if (state.phase === 'error') {
    return (
      <main className='flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 py-12'>
        <Notice tone='danger' className='max-w-sm'>
          Encryption couldn't be set up on this device.
        </Notice>
        <Button variant='secondary' onClick={state.retry}>
          Try again
        </Button>
        <Button variant='ghost' onClick={() => void logOut()}>
          Sign out
        </Button>
      </main>
    );
  }

  return (
    <IdentityKeyProvider keyPair={state.keyPair}>
      {children}
    </IdentityKeyProvider>
  );
}

function NeedsLinkScreen({
  code,
  expired,
  onRefresh,
  onSignOut,
}: {
  code: string;
  expired: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className='flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 py-12 text-center'>
      <h1 className='text-title text-ink'>Link this device</h1>
      <p className='max-w-sm text-subhead text-ink-muted'>
        This device doesn't have your encryption key yet. On a device you're
        already signed in on, open Settings, choose "Link a new device" under
        Linked devices, and enter this code:
      </p>
      {/* Only the part that changes is live, so an expired code is announced. */}
      <div role='status' aria-live='polite' className='flex flex-col items-center gap-4'>
        {expired ? (
          <>
            <p className='text-subhead font-semibold text-ink'>This code has expired.</p>
            <Button variant='secondary' onClick={onRefresh}>
              Get a new code
            </Button>
          </>
        ) : (
          <>
            <p
              className='rounded-md bg-surface-fill px-5 py-3 font-mono text-safety text-ink select-all'
              aria-label={`Linking code: ${code.split('').join(' ')}`}
            >
              {formatLinkCode(code)}
            </p>
            <Button
              variant='secondary'
              icon={copied ? 'check' : 'copy'}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy code'}
            </Button>
            <p className='text-footnote text-ink-muted'>Waiting for the other device…</p>
          </>
        )}
      </div>
      <p className='max-w-sm text-footnote text-ink-muted'>
        No other signed-in device? Without one, your encrypted messages can't
        be recovered.
      </p>
      <Button variant='ghost' onClick={onSignOut}>
        Sign out
      </Button>
    </main>
  );
}
