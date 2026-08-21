import { useState } from 'react';
import { Lock, LockOpen, KeyRound, ChevronRight, Info } from 'lucide-react';
import { COLOR } from '@/lib/constants';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/**
 * Privacy & Security settings section.
 *
 * States encryption status as it actually is, not as we'd like it to be:
 * 1:1 messages are always end-to-end encrypted (no opt-in toggle — see
 * messageCrypto.ts), group chats are plaintext until group E2EE ships
 * (v2). No recovery flow exists yet, so this section says so rather than
 * implying one.
 */
export function PrivacySecuritySection() {
  const [showInfo, setShowInfo] = useState(false);
  const keyState = useIdentityKeys();

  const keyStatusText =
    keyState.phase === 'ready'
      ? 'Active on this device'
      : keyState.phase === 'error'
        ? 'Needs attention — try reloading'
        : 'Checking…';

  return (
    <section
      className='rounded-2xl border p-5 md:p-6 space-y-5'
      style={{ backgroundColor: COLOR.white, borderColor: COLOR.hairline }}
      aria-labelledby='privacy-security-heading'
    >
      <div>
        <h2
          id='privacy-security-heading'
          className='text-sm font-semibold uppercase text-primary'
          style={{ letterSpacing: '0.04em' }}
        >
          Privacy & Security
        </h2>
        <p className='text-muted text-sm'>How your messages are protected</p>
      </div>

      <div className='flex flex-col gap-3'>
        <div
          className='flex items-start gap-3 rounded-xl px-4 py-3'
          style={{ border: `1px solid ${COLOR.hairline}` }}
        >
          <Lock
            size={18}
            aria-hidden='true'
            className='shrink-0 mt-0.5'
            style={{ color: COLOR.primary }}
          />
          <div>
            <p className='text-sm font-medium' style={{ color: COLOR.ink }}>
              Direct messages
            </p>
            <p className='text-xs mt-0.5' style={{ color: COLOR.muted }}>
              End-to-end encrypted. Only you and the person you're messaging
              can read them — not even WeakChat can.
            </p>
          </div>
        </div>

        <div
          className='flex items-start gap-3 rounded-xl px-4 py-3'
          style={{ border: `1px solid ${COLOR.hairline}` }}
        >
          <LockOpen
            size={18}
            aria-hidden='true'
            className='shrink-0 mt-0.5'
            style={{ color: COLOR.muted }}
          />
          <div>
            <p className='text-sm font-medium' style={{ color: COLOR.ink }}>
              Group chats
            </p>
            <p className='text-xs mt-0.5' style={{ color: COLOR.muted }}>
              Not end-to-end encrypted yet. Encrypted groups are planned for
              a future update.
            </p>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => setShowInfo(true)}
        className='wc-item wc-focus flex w-full items-center justify-between rounded-xl px-4 py-3 text-left'
        style={{ border: `1px solid ${COLOR.hairline}` }}
      >
        <span className='flex min-w-0 items-center gap-3'>
          <KeyRound
            size={18}
            aria-hidden='true'
            className='shrink-0'
            style={{ color: COLOR.primary }}
          />
          <span className='min-w-0'>
            <span className='block text-sm font-medium' style={{ color: COLOR.ink }}>
              Encryption key
            </span>
            <span
              className='block text-xs mt-0.5'
              style={{ color: COLOR.muted }}
              aria-live='polite'
            >
              {keyStatusText}
            </span>
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden='true'
          style={{ color: COLOR.muted, flexShrink: 0 }}
        />
      </button>

      <div
        className='flex gap-3 rounded-xl px-4 py-3'
        style={{ backgroundColor: COLOR.paleBlue }}
      >
        <Info
          size={18}
          aria-hidden='true'
          className='shrink-0 mt-0.5'
          style={{ color: COLOR.primary }}
        />
        <p className='text-xs' style={{ color: COLOR.ink }}>
          <strong>No recovery yet.</strong> If you lose access to every
          device signed into WeakChat, encrypted message history can't be
          restored. Use Linked devices below to add a second device while
          you still have this one.
        </p>
      </div>

      {showInfo && (
        <Modal
          titleId='encryption-info-title'
          title='How your messages are protected'
          onClose={() => setShowInfo(false)}
          footer={
            <Button
              variant='primary'
              size='md'
              onClick={() => setShowInfo(false)}
              className='w-full'
            >
              Got it
            </Button>
          }
        >
          <div
            className='space-y-3 overflow-y-auto px-5 py-4 text-sm'
            style={{ color: COLOR.ink }}
          >
            <p>
              Direct messages are encrypted before they leave your device
              and decrypted only on the recipient's. Our servers only ever
              handle ciphertext.
            </p>
            <p>
              The encryption key for a conversation comes from a secure
              exchange directly between your device and theirs. Every
              message is then encrypted individually with a fresh random
              value, so no two messages look alike and tampering is
              detectable.
            </p>
            <p>
              If we can't verify the other person's key, the message won't
              fall back to sending unencrypted — it simply won't send until
              a secure channel is confirmed.
            </p>
            <p>
              Group chats don't have this yet — every member needs their
              own copy of the group's key, which is a bigger change we're
              planning for a future release.
            </p>
            <p style={{ color: COLOR.muted }}>
              There's no way to recover your keys if every linked device is
              lost. A recovery option is planned but not available yet.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}