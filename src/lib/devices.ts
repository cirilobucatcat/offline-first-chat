/**
 * The users/{uid}/devices/{deviceId} collection: a purely cosmetic list of
 * "which devices are signed into this account," shown in Settings so the
 * user has visibility into their own account. This is NOT an access
 * control mechanism — see the honesty note on forgetDevice() below.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEVICE_ID_STORAGE_KEY = 'weakchat-device-id';

/** A stable per-browser-install identifier, generated once and cached in localStorage. Not secret — just a label key. */
export function getOrCreateLocalDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  }
  return id;
}

function guessDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android device';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'Device';
}

export interface DeviceRecord {
  deviceId: string;
  label: string;
  createdAt: Timestamp | null;
  lastSeen: Timestamp | null;
}

function deviceRef(uid: string, deviceId: string) {
  return doc(db, 'users', uid, 'devices', deviceId);
}

/**
 * Call once this device's identity key is ready (see useIdentityKeys).
 * Creates the device's entry on first run; on every later run, ONLY
 * touches `lastSeen` — never re-writes `label`, so a name the user picked
 * doesn't get silently clobbered on next launch. This is the same
 * unconditional-write trap as the key-overwrite and nameLower bugs: check
 * first, write only what actually needs updating.
 */
export async function registerOrTouchDevice(uid: string): Promise<void> {
  const deviceId = getOrCreateLocalDeviceId();
  const ref = deviceRef(uid, deviceId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
    return;
  }

  await setDoc(ref, {
    deviceId,
    label: guessDeviceLabel(),
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
}

/** For the Settings "Linked devices" list. */
export function watchDevices(
  uid: string,
  onUpdate: (devices: DeviceRecord[]) => void,
): () => void {
  const q = query(
    collection(db, 'users', uid, 'devices'),
    orderBy('lastSeen', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => d.data() as DeviceRecord));
  });
}

export async function renameDevice(
  uid: string,
  deviceId: string,
  label: string,
): Promise<void> {
  await setDoc(deviceRef(uid, deviceId), { label }, { merge: true });
}

/**
 * HONESTY NOTE: under the current device-linking design (Path A), every
 * linked device holds a full working copy of the identity private key.
 * Deleting a device's entry here is bookkeeping — it stops it showing up
 * in the list. It does NOT revoke that device's ability to decrypt
 * messages; there's no way to do that yet without rotating the identity
 * key entirely (which would also break decryption on every other device).
 * Any UI calling this needs to say so, not imply real revocation.
 */
export async function forgetDevice(
  uid: string,
  deviceId: string,
): Promise<void> {
  await deleteDoc(deviceRef(uid, deviceId));
}
