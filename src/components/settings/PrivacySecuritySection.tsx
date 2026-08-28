import { useState } from 'react';
import { Lock, LockOpen, KeyRound, ChevronRight, Info } from 'lucide-react';
import { COLOR } from '@/lib/constants';
import { useIdentityKeys } from '@/hooks/userIdentityKeys';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
      className='rounded-2xl border border-hairline dark:border-hairline-dark bg-white dark:bg-surface p-5 md:p-6 space-y-5'
      aria-labelledby='privacy-security-heading'
    >
      <div>
        <h2
          id='privacy-security-heading'
          className='text-sm font-semibold uppercase text-primary dark:text-accent'
          style={{ letterSpacing: '0.04em' }}
        >
          Privacy & Security
        </h2>
        <p className='text-muted dark:text-mist text-sm'>How your messages are protected</p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3 rounded-xl px-4 py-3 border border-hairline dark:border-hairline-dark'>
          <Lock size={18} aria-hidden='true' className='shrink-0 mt-0.5 text-primary dark:text-accent' />
          <div>
            <p className='text-sm font-medium text-ink dark:text-pale-blue'>Direct messages</p>
            <p className='text-xs mt-0.5 text-muted dark:text-mist'>
              End-to-end encrypted. Only you and the person you're messaging
              can read them — not even WeakChat can.
            </p>
          </div>
        </div>

        <div className='flex items-start gap-3 rounded-xl px-4 py-3 border border-hairline dark:border-hairline-dark'>
          <LockOpen size={18} aria-hidden='true' className='shrink-0 mt-0.5 text-muted dark:text-mist' />
          <div>
            <p className='text-sm font-medium text-ink dark:text-pale-blue'>Group chats</p>
            <p className='text-xs mt-0.5 text-muted dark:text-mist'>
              Not end-to-end encrypted yet. Encrypted groups are planned for
              a future update.
            </p>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => setShowInfo(true)}
        className='wc-item wc-focus flex w-full items-center justify-between rounded-xl px-4 py-3 text-left border border-hairline dark:border-hairline-dark'
      >
        <span className='flex min-w-0 items-center gap-3'>
          <KeyRound size={18} aria-hidden='true' className='shrink-0 text-primary dark:text-accent' />
          <span className='min-w-0'>
            <span className='block text-sm font-medium text-ink dark:text-pale-blue'>Encryption key</span>
            <span className='block text-xs mt-0.5 text-muted dark:text-mist' aria-live='polite'>
              {keyStatusText}
            </span>
          </span>
        </span>
        <ChevronRight size={18} aria-hidden='true' className='shrink-0 text-muted dark:text-mist' />
      </button>

      <div className='flex gap-3 rounded-xl px-4 py-3 bg-pale-blue dark:bg-accent/10'>
        <Info size={18} aria-hidden='true' className='shrink-0 mt-0.5 text-primary dark:text-accent' />
        <p className='text-xs text-ink dark:text-pale-blue'>
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
            <Button variant='primary' size='md' onClick={() => setShowInfo(false)} className='w-full'>
              Got it
            </Button>
          }
        >
          {/* Left as-is (COLOR-object, light-only) — Modal's own panel
              background isn't in a file I have yet, so I don't know if
              it's dark-aware. Switching this text to dark: colors without
              that guarantee risks light text on a light panel silently
              becoming illegible instead of just staying light-mode. */}
          <div className='space-y-3 overflow-y-auto px-5 py-4 text-sm text-ink dark:text-pale-blue'>
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
            <p className='text-muted dark:text-mist'>
              There's no way to recover your keys if every linked device is
              lost. A recovery option is planned but not available yet.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}