import { useEffect, useState } from 'react';
import {
  getOrCreateIdentityKeyPair,
  importPeerPublicKey,
} from '../lib/crypto/keyManager';
import { saveKeyPair } from '../lib/crypto/keyStore';
import {
  acceptLinkSession,
  createLinkSession,
  deleteLinkSession,
  watchLinkSession,
  type LinkSessionUpdate,
} from '@/lib/crypto/deviceLink';
import { useAuth } from '@/context/AuthContext';
import { registerOrTouchDevice } from '@/lib/devices';

export type IdentityKeysState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; keyPair: CryptoKeyPair }
  | { phase: 'needs-link'; code: string; cancel: () => void }
  | { phase: 'error'; error: unknown };

/**
 * Ensures this device has (or obtains) the signed-in account's E2EE
 * identity key pair. Call this once, high in the tree — e.g. inside
 * ProtectedRoute / IdentityKeyGate — after the user is authenticated.
 *
 * This is now the ONLY place identity keys get set up — sign-up used to
 * also fire getOrCreateIdentityKeyPair directly, unawaited, which raced
 * this same call once IdentityKeyGate mounted after navigation. Removed
 * there; this hook is the single path, for both brand-new accounts and
 * devices that just finished linking.
 *
 * 'needs-link' means this account already has a published key from some
 * other device. Rather than dead-ending there, this hook starts a device
 * link session immediately and listens for it to complete — see
 * deviceLink.ts for the handshake itself. Cancelling (via the returned
 * `cancel`) deletes the pending session and leaves the caller free to
 * retry, which re-runs this effect and starts a fresh one.
 */
export function useIdentityKeys(): IdentityKeysState {
  const { user } = useAuth();
  const [state, setState] = useState<IdentityKeysState>({ phase: 'idle' });

  useEffect(() => {
    if (!user?.uid) {
      setState({ phase: 'idle' });
      return;
    }

    const uid = user.uid;
    let cancelled = false;
    let unsubscribeSession: (() => void) | null = null;

    setState({ phase: 'loading' });

    function markReady(keyPair: CryptoKeyPair) {
      setState({ phase: 'ready', keyPair });
      // Bookkeeping only — never block getting the user into the app on
      // this succeeding, and never let a failure here surface as an
      // encryption error (it isn't one).
      void registerOrTouchDevice(uid).catch(() => {});
    }

    async function run() {
      const result = await getOrCreateIdentityKeyPair(uid);
      if (cancelled) return;

      if (result.status === 'created' || result.status === 'existing') {
        markReady(result.keyPair);
        return;
      }

      if (result.status === 'error') {
        setState({ phase: 'error', error: result.error });
        return;
      }

      // result.status === 'needs-link' from here on.
      const session = await createLinkSession(uid);
      if (cancelled) return;

      const cancel = () => {
        unsubscribeSession?.();
        unsubscribeSession = null;
        void deleteLinkSession(uid, session.sessionId);
      };

      setState({ phase: 'needs-link', code: session.code, cancel });

      const handleUpdate = async (update: LinkSessionUpdate | null) => {
        if (cancelled || !update || update.status !== 'ready') return;

        try {
          const privateKey = await acceptLinkSession(
            session.ephemeralKeyPair,
            session.sessionId,
            update,
          );
          const publicKey = await importPeerPublicKey(result.publicKeyJwk);
          if (cancelled) return;

          await saveKeyPair({
            uid,
            publicKey,
            privateKey,
            createdAt: Date.now(),
          });

          unsubscribeSession?.();
          unsubscribeSession = null;
          void deleteLinkSession(uid, session.sessionId);

          markReady({ publicKey, privateKey });
        } catch (error) {
          if (!cancelled) setState({ phase: 'error', error });
        }
      };

      unsubscribeSession = watchLinkSession(
        uid,
        session.sessionId,
        (update) => {
          void handleUpdate(update);
        },
      );
    }

    run();

    return () => {
      cancelled = true;
      unsubscribeSession?.();
    };
    // Depend on the primitive uid, not the `user` object — a fresh object
    // reference on every auth emission would otherwise re-run this needlessly.
  }, [user?.uid]);

  return state;
}