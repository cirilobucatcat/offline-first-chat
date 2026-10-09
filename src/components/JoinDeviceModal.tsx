import { useState, type FormEvent } from 'react';
import { useMyIdentityKey } from '@/context/IdentityContext';
import { useAuth } from '@/context/AuthContext';
import {
  completeLinkSession,
  findLinkSession,
  formatLinkCode,
  LINK_CODE_LENGTH,
  normalizeLinkCode,
} from '@/lib/crypto/deviceLink';
import { Field } from './Field';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Notice } from './ui/Notice';

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

    const normalized = normalizeLinkCode(code);
    if (normalized.length !== LINK_CODE_LENGTH) return;

    setStatus('linking');
    setErrorMessage('');

    try {
      const session = await findLinkSession(user.uid, normalized);
      if (!session) {
        setStatus('error');
        setErrorMessage("That code isn't valid. Check it and try again.");
        return;
      }

      await completeLinkSession(user.uid, session, privateKey);
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMessage(
        navigator.onLine
          ? 'Something went wrong. Try again.'
          : "Linking needs a connection. Try again when you're back online.",
      );
    }
  }

  return (
    <Modal titleId='link-device-title' title='Link a new device' onClose={onClose}>
      <div className='px-5 py-5'>
        {status === 'done' ? (
          <div className='flex flex-col gap-4'>
            <p role='status' className='text-body text-ink'>
              Linked. Your other device should unlock automatically within a few
              seconds.
            </p>
            <Button block onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <Field
              id='link-code-input'
              label='Linking code'
              value={code}
              // Shown in the same groups of four as on the other device. A
              // pasted code keeps working whatever it was separated with.
              onChange={(e) =>
                setCode(
                  formatLinkCode(
                    normalizeLinkCode(e.target.value).slice(0, LINK_CODE_LENGTH),
                  ),
                )
              }
              description="Enter the code shown on the device you're signing in on. Codes expire after 5 minutes."
              autoComplete='off'
              autoCapitalize='characters'
              autoCorrect='off'
              spellCheck={false}
              inputClassName='font-mono text-safety'
            />
            {status === 'error' && <Notice tone='danger'>{errorMessage}</Notice>}
            <Button type='submit' block isLoading={status === 'linking'} disabled={normalizeLinkCode(code).length < LINK_CODE_LENGTH}>
              Link device
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
