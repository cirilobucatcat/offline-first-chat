import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import { ensureUserProfile } from './users';

export type UpdateProfileNameResult =
  | { status: 'success' }
  | { status: 'error' };

/**
 * Updates the display name in both Firebase Auth (source of truth for
 * user.displayName) and the Firestore users/{uid} doc (source of truth
 * for search via nameLower). Goes through ensureUserProfile — the single
 * write path for that doc — rather than a second setDoc.
 *
 * Assumes user.email is always populated, since sign-up requires it for
 * this app's email/password accounts. If that ever isn't true, this would
 * need to skip the email field rather than write an empty string over a
 * real stored value.
 */
export async function updateDisplayName(
  user: User,
  name: string,
): Promise<UpdateProfileNameResult> {
  const trimmed = name.trim();
  if (!trimmed) return { status: 'error' };

  try {
    await updateProfile(user, { displayName: trimmed });
    await ensureUserProfile(user.uid, trimmed, user.email ?? '');
    return { status: 'success' };
  } catch {
    return { status: 'error' };
  }
}

export type ChangePasswordResult =
  | { status: 'success' }
  | { status: 'error'; code: string };

/**
 * Always reauthenticates with the current password first — Firebase
 * rejects updatePassword() on a session that isn't "recent." Returns the
 * Firebase error code so the UI can show something more specific than
 * "something went wrong."
 */
export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (!user.email) {
    return { status: 'error', code: 'auth/no-email' };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { status: 'success' };
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'unknown';
    return { status: 'error', code };
  }
}