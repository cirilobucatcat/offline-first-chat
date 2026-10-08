import {
  deleteUser,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import {
  clearIndexedDbPersistence,
  collection,
  doc,
  getDocsFromServer,
  terminate,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ensureUserProfile } from './users';
import { clearConversationKeyCache } from './crypto/conversationKeys';
import { forgetIdentityKeyPair } from './crypto/keyManager';

/** The `code` of a Firebase Auth or Firestore error, or 'unknown'. */
function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : 'unknown';
}

/**
 * Signs out of this device. The identity private key stays in IndexedDB on
 * purpose: there is no key recovery, so deleting it here would leave an
 * account with no other linked device unable to read or send direct
 * messages ever again. Only account deletion removes the key.
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
  clearConversationKeyCache();
}

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
    return { status: 'error', code: errorCode(error) };
  }
}

export type DeleteAccountResult =
  | { status: 'success' }
  | { status: 'error'; code: string };

/**
 * Closes the account and deletes what it owns: users/{uid} with its device
 * list and link sessions, then the Auth user, then this device's key and
 * local cache.
 *
 * Conversations and messages are NOT deleted. They belong to the other
 * participants too, and the rules don't let a client remove them. Any UI
 * calling this has to say so.
 *
 * The password check comes first, so a wrong password or no connection
 * fails before anything is deleted. Every step is safe to repeat: calling
 * this again after a failure part-way through finishes the job.
 *
 * On success the Firestore instance has been terminated. The caller must
 * do a full page load, not a client-side navigation.
 */
export async function deleteAccount(
  user: User,
  currentPassword: string,
): Promise<DeleteAccountResult> {
  if (!user.email) {
    return { status: 'error', code: 'auth/no-email' };
  }
  const uid = user.uid;

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // From the server, not the cache: offline this rejects instead of
    // queueing deletes that would never resolve.
    const userRef = doc(db, 'users', uid);
    const [devices, linkSessions] = await Promise.all([
      getDocsFromServer(collection(userRef, 'devices')),
      getDocsFromServer(collection(userRef, 'linkSessions')),
    ]);
    const batch = writeBatch(db);
    devices.forEach((device) => batch.delete(device.ref));
    linkSessions.forEach((session) => batch.delete(session.ref));
    batch.delete(userRef);
    await batch.commit();

    await deleteUser(user);
  } catch (error) {
    return { status: 'error', code: errorCode(error) };
  }

  // The account no longer exists. What is left is on this device, and a
  // failure here must not be reported as the deletion having failed.
  clearConversationKeyCache();
  await forgetIdentityKeyPair(uid).catch(() => {});
  await terminate(db)
    .then(() => clearIndexedDbPersistence(db))
    .catch(() => {});

  return { status: 'success' };
}