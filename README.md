# WeakChat

WeakChat is an offline-first chat app that installs as a PWA. Direct messages are end-to-end encrypted. Group chats are not.

It is built with React 19, TypeScript, Vite, Tailwind CSS 4 and Firebase (Auth and Firestore). There is no server code: Firebase is the whole backend.

## What it does

- **Direct messages**, encrypted on the sender's device and decrypted on the recipient's.
- **Group chats**, stored as plaintext.
- **Offline use.** Chats you have opened stay readable without a connection, and messages you send offline go out when you reconnect.
- **More than one device.** A signed-in device can hand your encryption key to a new one with a one-time code.

## Security model

Read this before you rely on WeakChat for anything sensitive.

### What is protected

- Each account has one P-256 key pair. The private key is created in the browser and stays in IndexedDB.
- For a direct chat, both sides derive the same AES-256-GCM key from their own private key and the other person's public key (ECDH, then HKDF-SHA256 bound to the conversation id).
- Every message gets a fresh 12-byte IV. The conversation id and sender id are authenticated with it, so a ciphertext cannot be replayed in another chat or under another sender.
- Firestore only ever holds ciphertext for direct messages. The chat list shows a fixed placeholder for them, not the text.
- Sending fails closed. If the other person has no published key, the message is not sent. There is no plaintext fallback, and the Firestore rules reject a plaintext message in a direct chat.
- Linking a device sends the private key wrapped under a one-time ECDH secret. The new device checks the key it receives against the account's published public key before saving it.

### What is not

- **Group messages are plaintext** in Firestore.
- **Contact keys are not verified.** Public keys are read from Firestore and trusted. There are no safety numbers and no warning when a contact's key changes, so the encryption is only as trustworthy as the database that hands out the keys.
- **No forward secrecy.** An account uses one long-lived key. Anyone who obtains a private key can read every past and future direct message of that account.
- **No key recovery.** If every device that holds your key is lost, or the browser data on your only device is cleared, your direct messages cannot be read again and the account cannot be given a new key.
- **The key stays on a device after you log out**, so that you can sign back in. Treat a shared computer accordingly. Deleting your account removes it from that device.
- **No device revocation.** The device list in Settings is a record, not access control. Removing an entry does not take the key away from that device.
- **Deleting an account** removes its profile, device list and published key. Chats and messages stay with the other participants.
- **Metadata is visible to the backend:** who talks to whom, when, group names and member lists. Every signed-in user can read other users' names and email addresses, because search needs them.

## Getting started

You need Node.js 22.12 or newer, and a Firebase project with Email/Password sign-in and Firestore enabled.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the six values from your Firebase web app config (Firebase console → Project settings → Your apps):

   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

3. Deploy the Firestore rules and indexes (see below).

4. Start the dev server:

   ```sh
   npm run dev
   ```

## Firestore rules and indexes

The app's security depends on the Firestore rules. They are part of this repo:

| File | Holds |
|---|---|
| `firestore.rules` | Who can read and write each collection |
| `firestore.indexes.json` | The chat list index, and the TTL policy that removes expired device-link sessions |
| `firebase.json` | Points the Firebase CLI at the two files above |

Deploy them with the Firebase CLI:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore --project <your-project-id>
```

If the project already has rules or indexes set in the console, compare them with these files first. Deploying replaces the live rules, and the CLI offers to delete indexes that are not in the file.

The rules worth knowing about:

- A user's `publicKey` can be written once and never changed. Replacing it would make every existing direct message unreadable.
- `users/{uid}/linkSessions` is readable and writable only by that account. Device linking relies on this.
- Messages cannot be edited or deleted, and a direct chat only accepts encrypted messages.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run the unit tests |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check, then build for production |
| `npm run preview` | Serve the production build |

The tests cover message encryption, the rules for creating an identity key, device linking and message parsing. They run in Node with Firestore mocked, so they need no Firebase project and no emulator. The Firestore rules themselves have no automated tests yet.

## Where things are

| Path | Holds |
|---|---|
| `src/lib/crypto/` | Key creation and storage, message encryption, device linking |
| `src/lib/chat.ts` | Sending messages and the chat list helpers |
| `src/lib/account.ts` | Log out, change password, delete account |
| `src/hooks/` | Live Firestore subscriptions and the identity key setup flow |
| `src/components/`, `src/pages/` | The interface |
