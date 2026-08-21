/**
 * Low-level IndexedDB storage for the account's E2EE identity key pair.
 *
 * CryptoKey objects are stored directly — not exported to bytes or base64
 * first. The browser's structured-clone algorithm knows how to persist
 * CryptoKey objects natively.
 *
 * SECURITY NOTE (changed for device linking): the identity private key is
 * now generated as extractable: true (see keyManager.ts), so it can be
 * wrapped and handed to a new device during linking. That means code with
 * a reference to this key — including an XSS payload — can now call
 * crypto.subtle.exportKey on it and read out raw bytes; it's no longer
 * true that it can only be *used* and never exported. This was a
 * deliberate tradeoff, not an oversight: a non-extractable key can never
 * be wrapped or moved to a second device by design, so "multi-device" and
 * "never extractable" are mutually exclusive — see keyManager.ts for the
 * fuller reasoning. Storing it as a CryptoKey object here (rather than raw
 * bytes) still matters — it stops casual misuse like accidentally logging
 * the key — it just no longer stops a determined XSS payload the way
 * non-extractable did.
 */

const DB_NAME = 'weakchat-keys';
const DB_VERSION = 1;
const STORE_NAME = 'identityKeys';

export interface StoredIdentityKeyPair {
  uid: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  createdAt: number;
}

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'uid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Returns this device's stored key pair for `uid`, or null if none exists. */
export async function getStoredKeyPair(
  uid: string,
): Promise<StoredIdentityKeyPair | null> {
  const database = await openKeyDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(uid);
    request.onsuccess = () => {
      resolve((request.result as StoredIdentityKeyPair | undefined) ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveKeyPair(entry: StoredIdentityKeyPair): Promise<void> {
  const database = await openKeyDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Wipes the local private key. Call on sign-out-everywhere or account deletion. */
export async function deleteStoredKeyPair(uid: string): Promise<void> {
  const database = await openKeyDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(uid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}