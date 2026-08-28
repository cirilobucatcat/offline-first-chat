import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { changePassword } from '@/lib/account';
import { Field } from '@/components/Field';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

  async function handleSubmit() {
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

  function EyeToggle({ shown, onToggle, label }: { shown: boolean; onToggle: () => void; label: string }) {
    return (
      <button
        type='button'
        onClick={onToggle}
        aria-label={label}
        className='absolute right-3.5 wc-focus rounded p-0.5 text-muted dark:text-mist'
      >
        {shown ? <EyeOff size={16} aria-hidden='true' /> : <Eye size={16} aria-hidden='true' />}
      </button>
    );
  }

  if (success) {
    return (
      <Modal
        titleId='change-password-title'
        title='Password updated'
        onClose={onClose}
        footer={
          <Button className='w-full' onClick={onClose}>
            Done
          </Button>
        }
      >
        <p className='px-5 py-6 text-center text-sm text-ink dark:text-pale-blue'>
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
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!canSubmit}>
            Update password
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-4 px-5 py-5'>
        <Field
          id='current-password'
          label='Current password'
          icon={Lock}
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete='current-password'
          rightSlot={
            <EyeToggle shown={showCurrent} onToggle={() => setShowCurrent((s) => !s)} label={showCurrent ? 'Hide current password' : 'Show current password'} />
          }
        />

        <Field
          id='new-password'
          label='New password'
          icon={Lock}
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete='new-password'
          rightSlot={<EyeToggle shown={showNew} onToggle={() => setShowNew((s) => !s)} label={showNew ? 'Hide new password' : 'Show new password'} />}
        />
        {passwordTooShort && <p className='text-xs text-error dark:text-error-dark'>At least 6 characters.</p>}

        <Field
          id='confirm-password'
          label='Confirm new password'
          icon={Lock}
          type={showNew ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete='new-password'
        />
        {passwordsMismatch && <p className='text-xs text-error dark:text-error-dark'>Passwords don't match.</p>}

        {error && (
          <p role='alert' className='text-sm text-error dark:text-error-dark'>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}