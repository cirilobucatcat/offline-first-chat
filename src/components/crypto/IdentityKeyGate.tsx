import { useState, type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { IdentityKeyProvider } from '@/context/IdentityContext';
import { logOut } from '@/lib/account';
import { Button } from '../ui/Button';

/**
 * Wraps authenticated routes and blocks rendering until this device has an
 * E2EE identity key ready. Mirrors ProtectedRoute's existing loading
 * treatment (centered Loader2, role="status", aria-live="polite").
 */
export function IdentityKeyGate({ children }: { children: ReactNode }) {
  const state = useIdentityKeys();

  if (state.phase === 'loading' || state.phase === 'idle') {
    return (
      <div
        className='flex min-h-screen items-center justify-center'
        role='status'
        aria-live='polite'
      >
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
        <span className='ml-3 text-legacy-ink/70'>Setting up encryption…</span>
      </div>
    );
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
      <div
        className='flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-legacy-ink'
        role='alert'
      >
        <p className='max-w-sm'>Encryption couldn't be set up on this device.</p>
        <Button variant='secondary' size='sm' onClick={state.retry}>
          Try again
        </Button>
        <Button variant='ghost' size='sm' onClick={() => void logOut()}>
          Sign out
        </Button>
      </div>
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
    <div
      className='flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center'
      role='status'
      aria-live='polite'
    >
      <ShieldAlert className='h-8 w-8 text-primary' aria-hidden='true' />
      <p className='max-w-sm text-legacy-ink'>
        This device doesn't have your encryption key yet. On a device you've
        already signed into, open Settings → Linked devices, choose "Link a new
        device," and enter this code:
      </p>
      {expired ? (
        <>
          <p className='max-w-sm text-body font-semibold'>This code has expired.</p>
          <Button variant='secondary' size='sm' onClick={onRefresh}>
            Get a new code
          </Button>
        </>
      ) : (
        <>
          <p
            className='rounded-lg bg-primary/10 px-6 py-3 font-mono text-2xl tracking-[0.3em] text-primary'
            aria-label={`Linking code: ${code.split('').join(' ')}`}
          >
            {code}
          </p>
          <Button
            variant='secondary'
            size='sm'
            icon={copied ? 'check' : 'copy'}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy code'}
          </Button>
          <p className='text-sm text-legacy-ink/60'>Waiting for the other device…</p>
        </>
      )}
      <p className='max-w-sm text-footnote'>
        No other signed-in device? Without one, your encrypted messages can't
        be recovered.
      </p>
      <Button variant='ghost' size='sm' onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
