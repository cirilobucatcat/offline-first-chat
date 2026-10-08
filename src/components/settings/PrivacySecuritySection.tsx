import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { SettingsLinkRow } from './SettingsLinkRow';
import { SettingsSection } from './SettingsSection';

export function PrivacySecuritySection() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <SettingsSection
      id='privacy-security-heading'
      title='Privacy and security'
      description='How your messages are protected'
    >
      <div>
        <p className='text-row-title text-ink'>Direct messages</p>
        <p className='mt-0.5 text-footnote text-ink-muted'>
          End-to-end encrypted. Only you and the person you're messaging
          can read them — not even WeakChat can.
        </p>
      </div>

      <div>
        <p className='text-row-title text-ink'>Group chats</p>
        <p className='mt-0.5 text-footnote text-ink-muted'>
          Not end-to-end encrypted yet. Encrypted groups are planned for
          a future update.
        </p>
      </div>

      {/* Settings renders inside IdentityKeyGate, so the key is always here. */}
      <SettingsLinkRow
        label='Encryption key'
        description='Active on this device'
        onClick={() => setShowInfo(true)}
      />

      <Notice>
        <strong className='font-semibold text-ink'>No recovery yet.</strong> If you lose access to every
        device signed into WeakChat, encrypted message history can't be
        restored. Use Linked devices below to add a second device while
        you still have this one. Logging out keeps your key on this
        device.
      </Notice>

      {showInfo && (
        <Modal
          titleId='encryption-info-title'
          title='How your messages are protected'
          onClose={() => setShowInfo(false)}
          footer={
            <Button variant='secondary' block onClick={() => setShowInfo(false)}>
              Close
            </Button>
          }
        >
          {/* Focusable, so the text can be scrolled from the keyboard. */}
          <div
            tabIndex={0}
            role='group'
            aria-labelledby='encryption-info-title'
            className='wc-scroll focus-ring-inset flex flex-col gap-3 overflow-y-auto px-5 py-4 text-subhead text-ink'
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
              If the other person has no encryption key yet, a message is
              never sent unencrypted instead. It isn't sent until they have
              one.
            </p>
            <p>
              WeakChat can't yet show you a way to verify a contact's key.
              Until it can, this protection relies on our servers handing
              out the right keys.
            </p>
            <p>
              Group chats don't have this yet — every member needs their
              own copy of the group's key, which is a bigger change we're
              planning for a future release.
            </p>
            <p className='text-ink-muted'>
              There's no way to recover your keys if every linked device is
              lost. A recovery option is planned but not available yet.
            </p>
          </div>
        </Modal>
      )}
    </SettingsSection>
  );
}
