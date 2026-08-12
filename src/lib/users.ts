import { collection, doc, getDoc, setDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  initials: string;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export async function ensureUserProfile(uid: string, name: string, email: string) {
  await setDoc(
    doc(db, 'users', uid),
    { name, nameLower: name.toLowerCase(), email, initials: getInitials(name), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function searchUsers(queryText: string, excludeUid: string): Promise<UserProfile[]> {
  const trimmed = queryText.trim().toLowerCase();
  if (!trimmed) return [];

  const q = query(
    collection(db, 'users'),
    orderBy('nameLower'),
    where('nameLower', '>=', trimmed),
    where('nameLower', '<', trimmed + '\uf8ff'),
    limit(10),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
    .filter((u) => u.uid !== excludeUid);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}