import { useState, type ReactNode } from 'react';
import { Check, Copy, Loader2, ShieldAlert } from 'lucide-react';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { IdentityKeyProvider } from '@/context/IdentityContext';
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
        <span className='ml-3 text-ink/70'>Setting up encryption…</span>
      </div>
    );
  }

  if (state.phase === 'needs-link') {
    return <NeedsLinkScreen code={state.code} onCancel={state.cancel} />;
  }

  if (state.phase === 'error') {
    return (
      <div
        className='flex min-h-screen items-center justify-center px-6 text-center text-ink'
        role='status'
        aria-live='polite'
      >
        Something went wrong setting up encryption. Try reloading the page.
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
  onCancel,
}: {
  code: string;
  onCancel: () => void;
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
      <p className='max-w-sm text-ink'>
        This device doesn't have your encryption key yet. On a device you've
        already signed into, open Settings → Linked devices, choose "Link a new
        device," and enter this code:
      </p>
      <p
        className='rounded-lg bg-primary/10 px-6 py-3 font-mono text-2xl tracking-[0.3em] text-primary'
        aria-label={`Linking code: ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <Button
        variant='neutral'
        size='sm'
        icon={copied ? Check : Copy}
        onClick={handleCopy}
      >
        {copied ? 'Copied' : 'Copy code'}
      </Button>
      <p className='text-sm text-ink/60'>Waiting for the other device…</p>
      <Button variant='ghost' size='sm' onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
