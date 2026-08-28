import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useMyIdentityKey } from '@/context/IdentityContext';
import { useAuth } from '@/context/AuthContext';
import { completeLinkSession, findLinkSession } from '@/lib/crypto/deviceLink';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface JoinDeviceModalProps {
  onClose: () => void;
}

export function JoinDeviceModal({ onClose }: JoinDeviceModalProps) {
  const { user } = useAuth();
  const { privateKey } = useMyIdentityKey();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'linking' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setStatus('linking');
    setErrorMessage('');

    try {
      const session = await findLinkSession(user.uid, normalized);
      if (!session) {
        setStatus('error');
        setErrorMessage("That code isn't valid. Check it and try again.");
        return;
      }

      await completeLinkSession(
        user.uid,
        session.sessionId,
        session.newDeviceEphemeralPublicKey,
        privateKey,
      );
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Try again.');
    }
  }

  return (
    <Modal titleId='link-device-title' title='Link a new device' onClose={onClose}>
      <div className='px-5 py-5'>
        {status === 'done' ? (
          <div className='flex flex-col items-center gap-3 py-4 text-center'>
            <KeyRound className='h-8 w-8 text-primary dark:text-accent' aria-hidden='true' />
            <p className='text-ink dark:text-pale-blue'>
              Linked. Your other device should unlock automatically within a few
              seconds.
            </p>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <p id='link-code-hint' className='text-sm text-ink/70 dark:text-pale-blue/70'>
              Enter the code shown on the device you're signing in on. Codes
              expire after 5 minutes.
            </p>
            <input
              id='link-code-input'
              type='text'
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder='XXXXXXXX'
              maxLength={8}
              autoComplete='off'
              autoCapitalize='characters'
              aria-label='Linking code'
              aria-describedby='link-code-hint'
              className='rounded-lg border border-border dark:border-hairline-dark bg-transparent px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-ink dark:text-pale-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:focus-visible:ring-accent/35'
            />
            {status === 'error' && (
              <p role='alert' className='text-sm text-danger dark:text-danger-dark'>
                {errorMessage}
              </p>
            )}
            <Button type='submit' isLoading={status === 'linking'} disabled={code.trim().length < 4}>
              Link device
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}