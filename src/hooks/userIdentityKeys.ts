import { useEffect, useState } from 'react';
import {
  getOrCreateIdentityKeyPair,
  importPeerPublicKey,
  privateKeyMatchesPublicKey,
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
  | {
      phase: 'needs-link';
      code: string;
      /** The code can no longer be used. Call `refresh` for a new one. */
      expired: boolean;
      /** Starts over with a fresh session and a new code. */
      refresh: () => void;
      /** Stops waiting and deletes the pending session. Call before signing out. */
      cancel: () => void;
    }
  | { phase: 'error'; error: unknown; retry: () => void };

const IDLE: IdentityKeysState = { phase: 'idle' };
const LOADING: IdentityKeysState = { phase: 'loading' };

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
 * deviceLink.ts for the handshake itself. The session ends when the other
 * device completes it, when its code expires, or when the caller calls
 * `cancel`. `refresh` (and `retry` after an error) re-runs the whole flow,
 * which starts a fresh session with a new code.
 */
export function useIdentityKeys(): IdentityKeysState {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [attempt, setAttempt] = useState(0);
  // A result is kept with the run (account + attempt) it belongs to. Anything
  // left over from an earlier run reads as 'loading', so the effect never has
  // to reset state itself.
  const [result, setResult] = useState<{ runKey: string; state: IdentityKeysState } | null>(null);
  const runKey = uid ? `${uid}:${attempt}` : null;

  useEffect(() => {
    if (!uid || !runKey) return;

    let cancelled = false;
    let closeSession: (() => void) | null = null;

    const publish = (state: IdentityKeysState) => {
      if (!cancelled) setResult({ runKey, state });
    };
    const restart = () => setAttempt((n) => n + 1);

    const markReady = (keyPair: CryptoKeyPair) => {
      publish({ phase: 'ready', keyPair });
      // Bookkeeping only — never block getting the user into the app on
      // this succeeding, and never let a failure here surface as an
      // encryption error (it isn't one).
      void registerOrTouchDevice(uid).catch(() => {});
    };

    const run = async () => {
      const identity = await getOrCreateIdentityKeyPair(uid);
      if (cancelled) return;

      if (identity.status === 'created' || identity.status === 'existing') {
        markReady(identity.keyPair);
        return;
      }

      if (identity.status === 'error') {
        publish({ phase: 'error', error: identity.error, retry: restart });
        return;
      }

      // identity.status === 'needs-link' from here on.
      const session = await createLinkSession(uid);
      if (cancelled) {
        // Torn down while the session was being written: nothing is
        // listening for it, so don't leave it behind.
        void deleteLinkSession(uid, session.sessionId).catch(() => {});
        return;
      }

      let open = true;
      let accepting = false;
      let unsubscribe: (() => void) | null = null;
      const expiryTimer = setTimeout(
        () => expire(),
        Math.max(0, session.expiresAt - Date.now()),
      );

      // Not awaited: a Firestore write never resolves while offline, and the
      // TTL policy on expiresAt removes the doc if this delete never lands.
      const close = () => {
        if (!open) return;
        open = false;
        clearTimeout(expiryTimer);
        unsubscribe?.();
        void deleteLinkSession(uid, session.sessionId).catch(() => {});
      };
      closeSession = close;

      const showCode = (expired: boolean) =>
        publish({
          phase: 'needs-link',
          code: session.code,
          expired,
          refresh: restart,
          cancel: close,
        });

      const expire = () => {
        if (!open || accepting) return;
        close();
        showCode(true);
      };

      const handleUpdate = async (update: LinkSessionUpdate | null) => {
        if (cancelled || !open || accepting) return;
        // The doc is gone: the TTL policy or another tab removed it.
        if (!update) {
          expire();
          return;
        }
        if (update.status !== 'ready') return;

        accepting = true;
        try {
          const privateKey = await acceptLinkSession(
            session.ephemeralKeyPair,
            session.sessionId,
            update,
          );
          const publicKey = await importPeerPublicKey(identity.publicKeyJwk);
          if (!(await privateKeyMatchesPublicKey(privateKey, publicKey))) {
            throw new Error('The linked key does not match the published key for this account.');
          }
          if (cancelled) return;

          await saveKeyPair({
            uid,
            publicKey,
            privateKey,
            createdAt: Date.now(),
          });

          close();
          markReady({ publicKey, privateKey });
        } catch (error) {
          close();
          publish({ phase: 'error', error, retry: restart });
        }
      };

      showCode(false);
      unsubscribe = watchLinkSession(uid, session.sessionId, (update) => {
        void handleUpdate(update);
      });
    };

    run().catch((error) => {
      publish({ phase: 'error', error, retry: restart });
    });

    return () => {
      cancelled = true;
      closeSession?.();
    };
    // Depend on the primitive uid, not the `user` object — a fresh object
    // reference on every auth emission would otherwise re-run this needlessly.
  }, [uid, runKey]);

  if (!runKey) return IDLE;
  return result?.runKey === runKey ? result.state : LOADING;
}
