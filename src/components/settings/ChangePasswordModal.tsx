import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { changePassword } from '@/lib/account';
import { Field } from '@/components/Field';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Notice } from '@/components/ui/Notice';

function passwordErrorMessage(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.';
    case 'auth/weak-password':
      return 'Choose a stronger password — at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a bit before trying again.';
    case 'auth/requires-recent-login':
      return 'For security, please sign out and back in, then try again.';
    default:
      return "Couldn't update your password. Try again.";
  }
}

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;

  const canSubmit =
    !isSubmitting &&
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    const result = await changePassword(user, currentPassword, newPassword);
    setIsSubmitting(false);

    if (result.status === 'success') {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(passwordErrorMessage(result.code));
    }
  }

  if (success) {
    return (
      <Modal
        titleId='change-password-title'
        title='Password updated'
        onClose={onClose}
        footer={
          <Button block onClick={onClose}>
            Done
          </Button>
        }
      >
        <p role='status' className='px-5 py-6 text-subhead text-ink-muted'>
          Your password has been changed.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      titleId='change-password-title'
      title='Change password'
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      footer={
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='submit' form='change-password-form' isLoading={isSubmitting} disabled={!canSubmit}>
            Update password
          </Button>
        </div>
      }
    >
      <form id='change-password-form' className='flex flex-col gap-4 overflow-y-auto px-5 py-5' onSubmit={handleSubmit}>
        <Field
          id='current-password'
          label='Current password'
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete='current-password'
          rightSlot={
            <IconButton
              icon={showCurrent ? 'eye-off' : 'eye'}
              label='Show current password'
              aria-pressed={showCurrent}
              size='sm'
              className='absolute right-1'
              onClick={() => setShowCurrent((s) => !s)}
            />
          }
        />

        <Field
          id='new-password'
          label='New password'
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete='new-password'
          error={passwordTooShort && 'At least 6 characters.'}
          rightSlot={
            <IconButton
              icon={showNew ? 'eye-off' : 'eye'}
              label='Show new password'
              aria-pressed={showNew}
              size='sm'
              className='absolute right-1'
              onClick={() => setShowNew((s) => !s)}
            />
          }
        />

        <Field
          id='confirm-password'
          label='Confirm new password'
          type={showNew ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete='new-password'
          error={passwordsMismatch && "Passwords don't match."}
        />

        {error && <Notice tone='danger'>{error}</Notice>}
      </form>
    </Modal>
  );
}
