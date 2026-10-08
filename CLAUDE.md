# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App identity

**WeakChat** is an offline-first chat PWA with end-to-end encrypted direct messages. Its manifest description is "Offline-first chat with end-to-end encrypted direct messages".

- The product name is always written `WeakChat`. The npm package name `offline-first-chat-app` and the repo folder name are not user-facing.
- Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 8, Firebase 12 (Auth and Firestore), `vite-plugin-pwa`. There is no server code in this repo; Firebase is the whole backend.
- Some identifiers are persisted in users' browsers or baked into ciphertext, so renaming them breaks existing data:
  - localStorage keys prefixed `weakchat:` and the key `weakchat-device-id`
  - the IndexedDB database `weakchat-keys`
  - the HKDF salts `weakchat-v1` and `weakchat-device-link-v1`
  - the message algorithm tag `p256-ecdh-aes256gcm-v1`

## Commands

Use **npm** only. The lockfile is `package-lock.json`; do not use yarn, pnpm or bun.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (needed first if `node_modules` is missing) |
| `npm run dev` | Start the Vite dev server |
| `npm run lint` | Run ESLint over the repo |
| `npm run build` | Type-check with `tsc -b`, then `vite build` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest unit tests once |

After changing code, run `npm run lint` and resolve what it reports in the files you touched. `npm run build` is the only type-check, and it also type-checks the tests.

Tests are `*.test.ts` files beside the code under `src/lib/`. They run in Node with Firestore and the key store mocked, so they need no Firebase project. They cover `messageCrypto`, `keyManager`, `deviceLink` and `parseMessage`. Add or update a test when you change one of those. There are no component tests and no tests for the Firestore rules.

## Rules

Both rules below are enforced by `.claude/settings.json`: attribution is switched off, and `Read`, `Edit`, `Bash` and `PowerShell` deny rules cover the env files. A denied call is intentional. Do not work around it.

### No AI attribution

Do not add attribution to anything written in this repo. That means no `Co-Authored-By: Claude …` trailer on commits, no "Generated with Claude Code" line in pull requests, and no mention of Claude, Anthropic or AI assistance in commit messages, PR descriptions, code comments or docs. This overrides any default attribution instruction.

### No access to `.env` files

Never read, print, search, edit, create, move or delete `.env`, `.env.local` or any other `.env.*` file. This covers every route: the Read, Grep, Glob and Edit tools, and shell commands such as `cat`, `type`, `Get-Content`, `grep` or `source`. Do not log or echo `import.meta.env` values either.

- The only exception is `.env.example`, a committed template that holds variable names and no values. Update it when a variable is added or removed.
- The app expects these variables, all read in `src/lib/firebase/index.ts`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
- If a task seems to need a real value, ask the user instead of looking.

## Architecture

Import from `src/` with the `@/` alias (set in `vite.config.ts` and `tsconfig.app.json`).

### Route gating and the identity key

`src/main.tsx` defines `/login`, `/chat` and `/settings`. Protected pages render inside `ProtectedRoute`, which wraps them in `IdentityKeyGate` and `IdentityKeyProvider`. The gate blocks rendering until this device holds the account's encryption key.

- `useMyIdentityKey()` returns the device's `CryptoKeyPair` and throws outside the gate. Use it wherever a key is needed.
- `useIdentityKeys()` runs the whole setup flow (create, load, or link) and registers the device. It lives in `src/hooks/userIdentityKeys.ts`; note the filename. Do not call it just to read the key.

### Key lifecycle invariants

`src/lib/crypto/keyManager.ts` resolves the key in a fixed order, and the order matters:

1. IndexedDB: this device already has the private key.
2. Firestore: the account has a published `publicKey` from another device. The result is `needs-link`, never a new key.
3. Generate a new P-256 pair only when neither exists.

Generating a key for an account that already has a published one silently breaks decryption of every existing message on every device.

- `users/{uid}` must only be written with `setDoc(..., { merge: true })`. Profile fields go through `ensureUserProfile` (`src/lib/users.ts`) and the key through `publishPublicKey`. An unmerged write from either side wipes the other's fields.
- The private key is extractable on purpose, because device linking needs `wrapKey`.
- **Logging out keeps the private key.** `logOut` in `src/lib/account.ts` signs out and clears the in-memory key caches, and nothing else. There is no key recovery, so deleting the key on logout locks a single-device account out for good. Only `deleteAccount` calls `forgetIdentityKeyPair`.
- `publicKey` is write-once in `firestore.rules`. If publishing a new key is rejected, `getOrCreateIdentityKeyPair` deletes the local key it just saved, so the device never keeps a key that nobody else knows.

### Messages

- **Direct messages** are encrypted in `src/lib/crypto/messageCrypto.ts`: ECDH, then HKDF-SHA256 with `info = conversation:{id}`, then AES-256-GCM with a fresh 12-byte IV and associated data `{conversationId}:{senderId}`.
- **Sending fails closed.** `sendMessage` in `src/lib/chat.ts` throws `PeerKeyMissingError` when the peer has no published key. Never add a plaintext fallback. `usePeerKeyStatus` holds Send ahead of time, and reports `missing` only from a server-confirmed snapshot so that an offline cache miss never holds it.
- **Group messages are plaintext** (`encrypted: false`). Do not describe groups as encrypted in UI copy.
- **Three message shapes share one subcollection:** legacy docs with no `encrypted` field, `encrypted: false`, and `encrypted: true`. `src/lib/firebase/parseMessage.ts` is the single place that tells them apart.
- **The conversation doc is a denormalised summary** (`lastMessage`, `unreadCount.{uid}`, `lastRead.{uid}`), written in the same batch as the message. The preview for a direct message is a fixed placeholder string, never the plaintext.
- **Direct conversation ids** are the two uids sorted and joined with `_` (`getConversationId`). Group ids are auto-generated.

### Device linking

`src/lib/crypto/deviceLink.ts` moves the private key to a new device. The new device writes a pending session under `users/{uid}/linkSessions/{code}` and shows the 8-character code. An existing device enters it in Settings, wraps the key under an ephemeral ECDH secret, and writes it back. Only the wrapped key ever reaches Firestore.

- A code lasts five minutes. `useIdentityKeys` marks it expired and deletes the session; `refresh` starts a new one. `cancel` deletes the session and must be called before signing out, while the device can still write.
- Before saving a linked key, the new device checks it against the published public key with `privateKeyMatchesPublicKey`. A mismatch is an error, and nothing is saved.

`users/{uid}/devices` is a cosmetic list. Removing an entry does not revoke that device's access, and the UI must not imply that it does.

### Firestore model

- `users/{uid}`: `name`, `nameLower` (prefix search), `email`, `initials`, `publicKey` (JWK)
- `users/{uid}/devices/{deviceId}` and `users/{uid}/linkSessions/{code}`
- `conversations/{id}` and `conversations/{id}/messages/{id}`

Security rules are in `firestore.rules`. The composite index and the TTL policy on `linkSessions.expiresAt` are in `firestore.indexes.json`, and `firebase.json` points the Firebase CLI at both. They take effect only when deployed, so the console can differ from the repo. Never deploy them yourself; that is the user's step.

- When a change adds a new read or write, update `firestore.rules` in the same change.
- The crypto code assumes rules that restrict `users/{uid}/linkSessions` to the account owner.
- The rules make `publicKey` write-once, make messages immutable, and reject a plaintext message in a direct chat.
- `deleteAccount` in `src/lib/account.ts` deletes `users/{uid}` with its devices and link sessions, then the Auth user, then the local key and cache. It does not delete conversations or messages, and the UI must not say that it does.

### Offline behaviour

- Offline support is Firestore's `persistentLocalCache` with `persistentMultipleTabManager` (`src/lib/firebase/index.ts`) plus a Workbox-precached app shell. There is no custom sync queue; do not add one.
- `serverTimestamp()` reads back as `null` locally until the server acknowledges the write. The UI treats `createdAt === null` as "Sending…".
- A Firestore write promise does not resolve while offline, so never block the UI on awaiting one.
- The service worker uses `registerType: 'prompt'`; `PwaUpdatePrompt` shows the update UI.

### Local preferences

Theme, appearance and chat preferences live in the contexts under `src/context/` and persist to localStorage. `index.html` has an inline script that applies `weakchat:theme` and `weakchat:textSize` before React mounts, so those keys and values must stay in sync with `ThemeContext` and `AppearanceContext`.

## Design system

The **WeakChat design system** is the source of truth for all UI:
https://claude.ai/artifact/4xdtb4NHAPUVKsCqpbwkw6

Read it with the Artifact tool before UI work. Start with `project/README.md` (the brand book), then `project/tokens.json`, then `project/components/<Name>/README.md` for the component in hand. Prop types are in `project/components/index.d.ts`. The rest of this section is a snapshot of version 1, taken on 2026-10-08. Where the snapshot and the artifact disagree, the artifact wins.

### Migration status

The code predates the design system and is being migrated to it in phases. The foundation, the shared components and the chat screens are in. Settings, sign-in and the encryption gate still use the old palette.

- **Palette.** `@theme` in `src/index.css` holds both palettes. The design-system tokens have their real names. The older palette (`primary` `#0D47A1`, `pale-blue`, `accent`, `mist` and others) stays until the last screen moves. Unmigrated screens switch themes with `dark:` class pairs such as `bg-white dark:bg-legacy-surface`, `text-legacy-ink dark:text-pale-blue` and `bg-primary dark:bg-accent`.
- **Themed tokens.** Each design-system colour has one name with a light and a dark value. In code that is a CSS variable overridden under `.dark`, so a design-system colour needs one class and no `dark:` pair. Shadows work the same way through the `--elevation-*` variables.
- **Legacy names.** `surface`, `ink`, `ink-muted` and `danger` existed in both palettes with different values, so the old ones are now `legacy-surface`, `legacy-ink`, `legacy-ink-muted` and `legacy-danger`. Never use a `legacy-*` class in new or changed UI. The migration is finished when none is left.
- **Class merging.** `cn()` is configured with the design-system text, radius, shadow, spacing and animation names. Add a new token name there as well as to `@theme`, or `cn()` will drop it when it meets a colour class.
- **Font loading.** Outfit ships with the app from `@fontsource-variable/outfit`, declared as the family `Outfit` in `src/index.css` and precached by Workbox.
- **Icons.** `Icon` in `src/components/ui/Icon.tsx` holds the design system's 24 glyphs, plus the glyphs it does not draw (close, settings, eye and others), which come from `lucide-react` at the same stroke. Unmigrated screens still import `lucide-react` directly; new and changed UI must not.
- **Components.** `Icon`, `IconButton`, `Button`, `Badge`, `Avatar`, `DeliveryStatus`, `MessageBubble`, `SystemNotice`, `Composer`, `ChatListItem`, `ChatHeader` and `ConnectionBanner` are in use. `TypingIndicator` and `SafetyNumber` are not built, because the app has neither feature. The modal, popover, toggle, field and settings card are restyled to the tokens. `SearchField` in `src/components/ui/` and `PersonRow` in `src/components/chats/` are this app's own, for the search input and the people results the design system does not specify.
- **Chat screens.** `ConversationList`, `MessageArea`, `ProfileBar` and `NewGroupModal` are on tokens. The thread opens with the encryption notice in a direct chat and the not-encrypted notice in a group. The Comfortable / Compact setting is gone. `ConnectionBanner` on the chat list replaced the global `NetworkStatusBanner`, so settings and sign-in show no connection state until their phases; `NetworkStatusBanner.tsx` is unused and goes in phase 5.
- **Direct-message preview.** `DIRECT_MESSAGE_PREVIEW` in `src/lib/chat.ts` is what `sendMessage` stores and what the chat list renders for any direct chat, whatever string the conversation doc holds.
- **Copy and marks.** The lock on direct chat headers and the emoji in chat copy are gone. Unmigrated screens have not been checked for emoji.
- **Done ahead of their phase.** A bug-fix pass removed the stub controls and the overclaiming copy without restyling the screens: the chat list lock line, Attach and Emoji, the profile picture controls, Forgot password, Remember me, and the terms checkbox. The same pass wired `usePeerKeyStatus` and the send-failure alert into `MessageArea`, added sign-out and the expired-code state to `IdentityKeyGate`, and rewrote `DeleteAccountModal` on tokens.
- **Legacy defects.** `dark:border-hairline-dark` is used in 7 files, all in settings, but the token is undefined and emits no CSS. The `wc-item`, `wc-icon-btn`, `wc-focus` and `wc-scroll` helper classes hard-code light colours.

### Migration phases

The migration lands one phase at a time, and the running app is reviewed between phases. Do one phase per request. After a phase, run `npm run lint` and `npm run build`, clear the lint findings in the files that phase rewrote, and update the table below and "Migration status" above.

| Phase | Status | Scope |
|---|---|---|
| 0. Foundation | Done | Tokens in `@theme`, the `legacy-*` rename, self-hosted Outfit, the `cn()` config, document title and theme colour |
| 1. Shared components | Done, not yet reviewed in a browser | The components listed under "Components" above |
| 2. Chat screens | Done, not yet reviewed in a browser | `src/pages/Chats.tsx` and `ConversationList`, `MessageArea`, `ProfileBar`, `NewGroupModal` in `src/components/chats/` |
| 3. Settings | Next | `src/pages/Settings.tsx`, `src/components/settings/`, `src/components/JoinDeviceModal.tsx` |
| 4. Sign-in, gates, prompts | Pending | `src/pages/Auth.tsx`, `src/components/auth/`, `IdentityKeyGate`, `ProtectedRoutes`, `NotFound`, `PwaUpdatePrompt` |
| 5. Cleanup | Pending | Remove the old palette and helper classes, close the theme |

**Phase 2: chat screens**

- **Chat list.** The header is the `title` "Chats" and a ghost `IconButton` (`compose`) that opens the existing popover. The lock line is already gone. `ConnectionBanner` sits under the header and replaces the global `NetworkStatusBanner` in `src/main.tsx`. Rows are `ChatListItem`.
- **Times.** `formatRelativeTime` shows a time today, a weekday this week and a date when older, and is passed the 12h/24h preference, which the list ignores today.
- **Thread.** The ground is `canvas` with `space-3` gutters. The `ChatHeader` subtitle is "4 members" in a group, empty in a direct chat, and the connection text whenever the app is not online. Back is hidden from `md` up.
- **First item.** A direct chat opens with the encryption notice, without "and calls" because the app has no calls. A group opens with an `info` notice: "Messages in this group are not end-to-end encrypted."
- **Runs.** Add `groupMessagesIntoRuns` beside `groupMessagesByDay` in `src/lib/chat.ts`: same sender, same day, within five minutes.
- **Delivery.** `createdAt === null` is `queued` when offline and `sending` when online. A set `createdAt` is `sent`, and `isMessageReadByAll` is `read`. Nothing produces `delivered` or `failed`. Chat list rows use the same mapping with `lastMessageAt === null` and `isLastMessageReadByAll`.
- **Connection.** `useNetworkStatus()` maps straight across; `connecting` is unused. The offline banner carries no count, because there is no outbox to count.
- **Composer.** Replace the form in `MessageArea` with `Composer`. The behaviour is already there and moves across: `held` is `peerKeyStatus === 'missing'`, and `notice` is the no-key line or the `role="alert"` line for a send that threw. Attach and Emoji are already gone.
- **Density.** The Comfortable / Compact setting is removed from `MessageArea`, `AppearanceContext` and `AppearanceSection`.
- **Copy.** No emoji in the placeholder strings in `src/lib/chat.ts` and `src/lib/crypto/conversationKeys.ts`. The chat list shows the fixed direct-message preview at render time, so conversations that already store the old string stop showing the lock.

**Phase 3: settings**

- The page ground is `surface`. All seven sections use `SettingsSection`, with `headline` titles in sentence case.
- The three hand-rolled radio groups (theme, text size, timestamp) become one `src/components/ui/SegmentedControl.tsx`, with a check on the selected segment.
- The profile has an `xl` avatar and no upload, remove or camera controls (already removed). "Save changes" is the page's one primary button.
- `danger` is for the delete-account confirmation only. "Forget" and "Remove from list" are `secondary`, because they edit a cosmetic list.
- The `lock` glyph leaves the privacy rows.
- `ThemeContext` keeps the `theme-color` meta in step with the theme. Today only the inline script in `index.html` sets it, so it is stale after an in-app switch.

**Phase 4: sign-in, gates, prompts**

- Sign-in is one column on `surface`: the wordmark, a `display` title, the fields, one block primary button, a ghost link that switches mode and updates the URL, and the footnote "Direct messages are end-to-end encrypted. Group chats are not yet."
- Removed: the brand panel, the logo mark, the feature list, the testimonial and the pulse. Forgot password, Remember me and the terms checkbox with its gating are already gone, and the footnote already has its final wording.
- Errors are `danger` on `danger-soft` with the `alert` glyph and `role="alert"`.
- `IdentityKeyGate`, the route loader and `NotFound` move to tokens. The linking code uses the `safety` style.
- `PwaUpdatePrompt` becomes a `surface-raised` toast with a `secondary` Reload and a labelled close button.
- `body` gets `surface` and `ink` here, once no screen relies on the white default.

**Phase 5: cleanup**

- Delete every old token from `@theme`, and the `wc-item`, `wc-icon-btn`, `wc-focus`, `btn-primary`, `auth-card` and `field-fade` helpers.
- Delete `NetworkStatusBanner.tsx`, `auth/FeatureItem.tsx`, `Checkbox.tsx`, the colour constants in `src/lib/constants.ts` and the empty `src/App.css`.
- Reset the `--color-*`, `--radius-*`, `--shadow-*` and `--text-*` namespaces to `initial` ahead of the design-system values, so an off-system class such as `bg-white` or `text-sm` emits nothing.
- Replace "Migration status" and this section with a short description of the finished state.

The migration is finished when a search over `src/` finds none of these:

- a `legacy-*`, `hairline-dark`, `pale-blue`, `primary`, `accent` or `mist` class
- a `dark:` colour pair
- a hex value or `rgba(` in a `.tsx` file
- a `lucide-react` import outside `src/components/ui/Icon.tsx`
- an emoji

### How to apply it

- New and changed UI follows the design system: its principles, copy rules, type scale, spacing, radii, sizes and component behaviour.
- For colour, use design-system token names and values. Add a missing token to `@theme` as a themed variable; never hard-code a value.
- Restyling a screen you were not asked to touch is a migration. Do it only when asked, and follow the phases above.
- The design system assumes every chat is encrypted. Here, group chats are not. Never show the encryption notice or any encryption claim in a group chat.
- The design system specifies features the app does not have yet: calls, reactions, replies, typing, presence, safety numbers, disappearing messages, mute and pin. Do not add UI for a feature that does not exist.
- The design system does not specify a modal, popover menu, toggle, form field or settings card. Reuse `src/components/ui/`, `src/components/Field.tsx` and `src/components/settings/SettingsSection.tsx` for those, and merge class names with `cn()` from `src/lib/helpers.ts`.

### Principles

1. **The device is the source of truth.** Reading, writing, searching and sending work offline. Offline is a state, not an error: never block, disable or grey out an action because the network is down. Queue it.
2. **Always say where the message is.** There are six delivery states, each with its own shape.
3. **Encryption is quiet until something changes.** Say it once at the top of an encrypted chat. Do not put a lock on every row.
4. **Familiar first.** When in doubt, do what the common messengers do.

### Voice and copy

- Plain, calm, second person. Sentence case everywhere, including buttons and titles.
- Ongoing states end with the `…` character: "Waiting for network…", "Connecting…", "Updating…".
- Never blame or alarm. Write "Waiting for network…", not "Connection failed!".
- No exclamation marks and no emoji in interface copy. Emoji belong to people's messages and reactions.
- Name the guarantee plainly and never overclaim. Say "end-to-end encrypted", "safety number", "verified". Never say "military-grade", "unhackable" or "100% secure".
- State the limits of this app honestly: no key recovery, no real device revocation, no group encryption.
- Buttons are verbs: "Mark as verified", "Retry now". Destructive labels say how far the damage goes: "Delete for everyone".
- Times follow the device locale: today as a time, this week as a weekday, older as a date.

| Moment | Copy |
|---|---|
| Offline banner | **You're offline.** 3 messages will send when you're back. |
| Composer, offline | Offline — messages are saved and send when you reconnect. |
| Queued message | Waiting for network |
| Failed message | Not sent · Tap to retry |
| Top of an encrypted chat | **End-to-end encrypted.** Messages and calls in this chat stay between you and the people in it. Not even WeakChat can read them. |

### Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#ebeff6` | `#0a0e16` | Thread background behind bubbles and notices |
| `surface` | `#ffffff` | `#111722` | Chat list, headers, settings, composer bar |
| `surface-raised` | `#ffffff` | `#19202d` | Cards and pills on canvas, menus, sheets |
| `surface-fill` | `#eff2f8` | `#212a38` | Hovered rows, text fields, secondary buttons |
| `line` | `#dfe5ee` | `#283244` | Hairline dividers; decorative only |
| `line-strong` | `#7b879a` | `#6b7891` | Borders that define a control |
| `ink` | `#0e1626` | `#e7ecf5` | Primary text and icons |
| `ink-muted` | `#525f74` | `#9ba7bb` | Secondary text |
| `brand` | `#1d5bd6` | `#7aa6ff` | The one brand hue: primary action, unread badge, read receipt, links |
| `brand-pressed` | `#17489f` | `#a6c3ff` | Pressed brand fill |
| `brand-soft` | `#e1ebfd` | `#15274a` | Ground behind brand text; selected row |
| `on-brand` | `#ffffff` | `#071530` | Text and icons on a brand fill |
| `bubble-in` | `#ffffff` | `#1b2331` | Incoming bubble |
| `bubble-out` | `#1d5bd6` | `#234e9c` | Outgoing bubble |
| `on-bubble-out` | `#ffffff` | `#f2f6ff` | Text in an outgoing bubble |
| `bubble-out-meta` | `#dce7fc` | `#bfd1f5` | Time and ticks in an outgoing bubble |
| `presence` | `#22a35a` | `#3fd47f` | The online dot only |
| `warn` | `#8a5200` | `#f2b544` | Offline and key-change text and icons |
| `warn-soft` | `#fff0d4` | `#3a2b0e` | Ground of the offline banner and key-change notice |
| `danger` | `#b42323` | `#ff8b85` | Not sent, destructive actions |
| `danger-soft` | `#fde7e7` | `#3d1716` | Ground behind danger text |
| `on-danger` | `#ffffff` | `#2a0b0a` | Label on a danger fill |
| `badge-muted` | `#646e85` | `#3f4a5e` | Unread counter for muted chats |
| `on-badge-muted` | `#ffffff` | `#e7ecf5` | Count on `badge-muted` |
| `scrim` | `#0e162666` | `#000000a6` | Backdrop behind sheets |

- **Aliases:** `on-bubble-in` is `ink`, `bubble-in-meta` is `ink-muted`, `link` is `brand`.
- **Avatar tints:** `avatar-1` to `avatar-6` are `#b5462f`, `#8f5a00`, `#2f7a3e`, `#11707a`, `#7349a6` and `#a33d6b`, with `on-avatar` `#ffffff`. Pick one by a stable hash of the contact id. They carry no meaning.
- **Brand use:** one brand-filled control per screen, besides the bubbles.
- **States:** `warn`, `danger` and `presence` always come with an icon or a word.

### Type

One family, **Outfit** (`"Outfit", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`). Safety numbers use the platform monospace stack. Use weight 400 for messages and body, 500 for captions, 600 for names and headings, 700 for titles. Use nothing below 400.

| Style | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 28 / 34 | 700 | Onboarding and empty-state titles, once per screen |
| `title` | 20 / 26 | 700 | Screen titles |
| `headline` | 17 / 22 | 600 | Chat header name, sheet and card titles |
| `row-title` | 16 / 20 | 600 | Chat names in the list, setting names |
| `body` | 16 / 22 | 400 | Message text and composer input; never smaller |
| `subhead` | 15 / 20 | 400 | Previews, reply quotes, secondary row text |
| `footnote` | 13 / 18 | 400 | Banners, notices, header subtitles, helper text |
| `caption` | 12 / 16 | 500 | Times and counts; never sentences |
| `safety` (mono) | 17 / 26 | 500 | Safety numbers, in groups of five digits |

- The scale is given in px at a 16px root. Write it in rem so the app's text-size setting, which scales the root font size, keeps working.
- Use `tabular-nums` for times and counts.

### Space, shape and size

- **Spacing (4px base):** `space-0.5` 2px, `space-1` 4px, `space-2` 8px, `space-3` 12px, `space-4` 16px, `space-5` 20px, `space-6` 24px, `space-8` 32px, `space-12` 48px.
- **Radius:** `radius-xs` 4px, `radius-sm` 8px, `radius-md` 12px, `radius-bubble` 18px, `radius-sheet` 20px, `radius-full` 9999px.
- **Sizes:** icons 16px and 24px; avatars 16, 28, 40, 54 and 88px; `size-hit` 44px; `size-row` 76px; `size-bubble-max` 78%.
- **Thread rhythm:** bubbles in one run sit `space-0.5` apart, and a new sender starts `space-3` below. Thread gutters are `space-3`; list and header gutters are `space-4`.
- **Bubbles:** `radius-bubble` on free corners, `radius-xs` where they join their run on the sender's side. Never truncate a message.
- **Controls:** every control has at least a 44px target. Buttons, badges and avatars are fully round. Cards and banners use `radius-md`.
- **Elevation:** flat by default. `shadow-bubble` lifts bubbles and notices off the canvas, `shadow-raised` is for cards and the composer, and `shadow-float` is for menus and floating buttons. Exact values are in `tokens.json`.

### Motion

- New bubbles rise 8px and fade in over 150ms ease-out. Sheets slide up over 240ms.
- Loops run only while something is in progress: typing dots, the sync icon, the sending clock.
- Reduced motion stops every loop. In this app that means both `prefers-reduced-motion` and the `.reduce-motion` class on `<html>`.

### Icons

- The design system draws its own 24 icons on a 24px grid: 1.75px stroke, round caps and joins, outline only. They inherit `currentColor`. Idle controls are `ink-muted`; active ones are `ink` or `brand`.
- Names: `send`, `attach`, `mic`, `smile`, `camera`, `lock`, `shield-check`, `key`, `timer`, `clock`, `check`, `check-double`, `alert`, `cloud-off`, `sync`, `search`, `compose`, `back`, `more`, `phone`, `video`, `pin`, `bell-off`, `reply`.
- Fixed meanings: `lock` appears in the encryption notice only, `shield-check` marks a verified contact, `key` marks a safety-number change, `cloud-off` means offline, and `clock` means waiting on this device.
- In code, use `Icon` from `src/components/ui/Icon.tsx` and keep these meanings. A glyph the set does not draw is added to that file's `EXTRA` map from `lucide-react`; nothing else imports `lucide-react`.
- There is no logo. Set "WeakChat" in Outfit bold where a wordmark is needed.

### Components

The design system ships 14 React components as a reference bundle in the artifact (`project/components/bundle.js` and `bundle.css`). They are not an importable package. When one is needed here, implement it in `src/components/` to its README and `index.d.ts`.

| Component | Key rules |
|---|---|
| `Icon` | 24px by default, 20px in dense controls, 16px inline with caption text |
| `Avatar` | Sizes `xs` to `xl`. Show initials until a photo exists; never a grey placeholder. Hide presence while offline |
| `Badge` | Unread count; `muted`, `mention` and `dot` forms. Never put words in a badge |
| `Button` | `primary`, `secondary`, `ghost`, `danger`; `md` 44px and `sm` 36px. One primary per screen. Never disabled for lack of network |
| `IconButton` | `ghost`, `tonal`, `primary`. A label is required. `primary` is reserved for Send and New chat |
| `DeliveryStatus` | Six states, for your own messages only |
| `MessageBubble` | `direction`, `position` in its run, a pre-formatted `time`, and `status` for outgoing |
| `TypingIndicator` | Shown only while connected |
| `SystemNotice` | Kinds: `date`, `info`, `encryption`, `key-change`, `timer`, `offline`. One sentence each |
| `Composer` | Send is never disabled offline; `offline` shows the saved-message hint. The placeholder stays "Message" |
| `ChatListItem` | 76px row. Preview order: typing, then draft, then last message. No lock on rows |
| `ChatHeader` | The subtitle carries connection state. Two actions at most |
| `ConnectionBanner` | Offline, connecting and syncing strip on the chat list. Online renders nothing |
| `SafetyNumber` | 60 digits in twelve groups of five. Unverified is the default, never shown as a danger |

Delivery states, each told apart by shape and not only by colour:

| Status | Glyph | Label |
|---|---|---|
| `queued` | clock | Waiting for network |
| `sending` | clock, hand turning | Sending |
| `sent` | one check | Sent |
| `delivered` | two checks | Delivered |
| `read` | two checks cut out of a filled pill | Read |
| `failed` | alert circle | Not sent |

`queued` is normal, not an error. Never colour it as a warning.

### Accessibility

- Text is at least 4.5:1 on its ground in both themes. Marks, icons and control borders are at least 3:1.
- Nothing is told by colour alone.
- Keyboard focus is `focus-ring`: a 2px gap in the ground colour, then 2px of solid `brand`, drawn as a box-shadow so it follows any radius.
- Icon-only buttons carry an `aria-label`; decorative icons carry `aria-hidden="true"`.
- Loading states use `role="status"` with `aria-live="polite"`; errors use `role="alert"`.
- Inputs without a visible label get an `sr-only` label. Switches use `role="switch"` with `aria-checked`.
