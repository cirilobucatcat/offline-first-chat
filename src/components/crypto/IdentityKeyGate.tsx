import type { ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { IdentityKeyProvider } from '@/context/IdentityContext';

/**
 * Wraps authenticated routes and blocks rendering until this device has an
 * E2EE identity key ready. Mirrors ProtectedRoute's existing loading
 * treatment (centered Loader2, role="status", aria-live="polite").
 *
 * The 'needs-recovery' branch is a placeholder: real key recovery (the
 * password-derived backup from the E2EE plan) isn't built yet. Showing this
 * instead of silently generating a second key is intentional — a second key
 * would desync from the account's already-published public key and
 * permanently break decryption on this device.
 */
export function IdentityKeyGate({ children }: { children: ReactNode }) {
  const state = useIdentityKeys();

  if (state.phase === 'loading' || state.phase === 'idle') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-ink/70">Setting up encryption…</span>
      </div>
    );
  }

  if (state.phase === 'needs-recovery') {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <ShieldAlert className="h-8 w-8 text-primary" aria-hidden="true" />
        <p className="max-w-sm text-ink">
          This device doesn't have your encryption key yet, and cross-device recovery isn't
          available in WeakChat yet. Sign in on the device where this account was first set up.
        </p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6 text-center text-ink"
        role="status"
        aria-live="polite"
      >
        Something went wrong setting up encryption. Try reloading the page.
      </div>
    );
  }

  return <IdentityKeyProvider keyPair={state.keyPair}>{children}</IdentityKeyProvider>;
}