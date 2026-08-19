/**
 * Low-level IndexedDB storage for the account's E2EE identity key pair.
 *
 * CryptoKey objects are stored directly — not exported to bytes or base64
 * first. The browser's structured-clone algorithm knows how to persist
 * CryptoKey objects natively, and because the private key is generated as
 * non-extractable (see keyManager.ts), application code — including an XSS
 * payload — can never read it out as raw bytes. It can only be *used* via
 * crypto.subtle.deriveKey / deriveBits, never exported.
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
export async function getStoredKeyPair(uid: string): Promise<StoredIdentityKeyPair | null> {
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