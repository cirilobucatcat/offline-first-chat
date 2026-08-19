import { useEffect, useState } from 'react';
import { getOrCreateIdentityKeyPair } from '../lib/crypto/keyManager';
import { useAuth } from '@/context/AuthContext';

export type IdentityKeysState =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | { phase: 'ready' }
    | { phase: 'needs-recovery' }
    | { phase: 'error'; error: unknown };

/**
 * Ensures this device has (or creates) the signed-in account's E2EE
 * identity key pair. Call this once, high in the tree — e.g. inside
 * ProtectedRoute / IdentityKeyGate — after the user is authenticated.
 */
export function useIdentityKeys(): IdentityKeysState {
    const { user } = useAuth();
    const [state, setState] = useState<IdentityKeysState>({ phase: 'idle' });

    useEffect(() => {
        if (!user?.uid) {
            setState({ phase: 'idle' });
            return;
        }

        let cancelled = false;
        setState({ phase: 'loading' });

        getOrCreateIdentityKeyPair(user.uid).then((result) => {
            if (cancelled) return;
            switch (result.status) {
                case 'created':
                case 'existing':
                    setState({ phase: 'ready' });
                    break;
                case 'needs-recovery':
                    setState({ phase: 'needs-recovery' });
                    break;
                case 'error':
                    setState({ phase: 'error', error: result.error });
                    break;
            }
        });

        return () => {
            cancelled = true;
        };
        // Depend on the primitive uid, not the `user` object — a fresh object
        // reference on every auth emission would otherwise re-run this needlessly.
    }, [user?.uid]);

    return state;
}