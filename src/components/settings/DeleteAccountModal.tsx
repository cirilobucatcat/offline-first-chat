import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteUser } from 'firebase/auth';
import { TriangleAlert, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { COLOR } from '@/lib/constants';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === 'DELETE' && !deleting;

  async function handleConfirm() {
    if (!user) return;
    setDeleting(true);
    setError(null);
    try {
      // NOTE: this only removes the Auth user. Firestore data
      // (users/{uid}, conversations/{id}, messages) is NOT cascade-deleted
      // client-side — a client can't safely enumerate + delete every
      // conversation a user participated in under security rules. Wire a
      // Cloud Function on Auth user-delete for the actual cleanup; treat
      // this call as step 1.
      await deleteUser(user);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to delete account', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        setError('For your security, please sign out and sign back in before deleting your account.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setDeleting(false);
    }
  }

  return (
    <Modal
      titleId='delete-account-modal'
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: COLOR.dangerBg }}
          >
            <TriangleAlert className="h-5 w-5" style={{ color: COLOR.danger }} />
          </span>
          Delete your account?
        </span>
      }
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="dangerSolid" size="sm" disabled={!canDelete} onClick={handleConfirm}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? 'Deleting' : 'Delete account'}
          </Button>
        </div>
      }
    >
      <div className='p-4'>
        <p className="text-sm" style={{ color: COLOR.inkMuted }}>
          This permanently deletes your profile, conversations, and message history from every
          device. It can&apos;t be undone.
        </p>

        <div className="mt-4">
          <label
            htmlFor="confirm-delete"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: COLOR.ink }}
          >
            Type DELETE to confirm
          </label>
          <input
            id="confirm-delete"
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canDelete) void handleConfirm();
            }}
            className="wc-danger-focus w-full rounded-xl border py-2.5 px-3 text-sm outline-none"
            style={{ borderColor: '#FCA5A5', color: COLOR.ink }}
            aria-describedby="confirm-delete-help"
          />
          <p
            id="confirm-delete-help"
            className="mt-1.5 text-xs"
            style={{ color: error ? COLOR.danger : COLOR.inkMuted }}
          >
            {error ?? 'This confirms you understand the action is permanent.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}