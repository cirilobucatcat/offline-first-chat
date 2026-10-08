import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Field } from '@/components/Field';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/lib/account';

interface DeleteAccountModalProps {
  onClose: () => void;
}

function deleteErrorMessage(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'That password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a bit before trying again.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return "Deleting your account needs a connection. Try again when you're online.";
    case 'permission-denied':
      return "Your account data couldn't be deleted, so your account is still open. Try again later.";
    default:
      return "Your account couldn't be deleted. Try again.";
  }
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = password.length > 0 && !deleting;

  async function handleConfirm() {
    if (!user || !canDelete) return;
    setDeleting(true);
    setError(null);

    const result = await deleteAccount(user, password);
    if (result.status === 'success') {
      // A full page load, not navigate(): deleteAccount shut down the
      // Firestore instance the running app was using.
      window.location.replace('/login');
      return;
    }

    setError(deleteErrorMessage(result.code));
    setDeleting(false);
  }

  return (
    <Modal
      titleId='delete-account-modal'
      title='Delete your account?'
      onClose={() => {
        if (!deleting) onClose();
      }}
      footer={
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant='danger' icon='trash' isLoading={deleting} disabled={!canDelete} onClick={handleConfirm}>
            Delete account
          </Button>
        </div>
      }
    >
      <form
        className='flex flex-col gap-4 px-5 py-5'
        onSubmit={(e) => {
          e.preventDefault();
          void handleConfirm();
        }}
      >
        <p className='text-subhead text-ink-muted'>
          This closes your account and deletes your profile, your device list and the encryption
          key on this device. Chats you were in stay with the other people in them, including your
          name and the messages you sent. It can&apos;t be undone.
        </p>

        <Field
          id='delete-account-password'
          label='Current password'
          type='password'
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          autoComplete='current-password'
        />

        {error && (
          <p role='alert' className='flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-footnote text-danger'>
            <Icon name='alert' size={16} className='mt-px' />
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
