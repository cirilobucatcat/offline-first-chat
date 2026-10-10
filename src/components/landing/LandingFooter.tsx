// Read once at load, because rendering cannot read the clock.
const YEAR = new Date().getFullYear();

/** The name, the app's limits stated plainly, and the copyright line. It links nowhere: there are no other public pages. */
export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6">
        <p className="text-row-title font-bold text-ink">WeakChat</p>
        <p className="max-w-md text-footnote text-ink-muted">
          Group chats are not end-to-end encrypted yet. There is no key recovery, and removing a device from your
          list does not revoke its access.
        </p>
        <p className="mt-2 text-footnote text-ink-muted">© {YEAR} WeakChat</p>
      </div>
    </footer>
  );
}
