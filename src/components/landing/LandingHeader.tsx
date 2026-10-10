import { ButtonLink } from '../ui/Button';
import { Wordmark } from '../Wordmark';

/** The top bar of the landing page. "Create your account" is not here: the hero holds the page's one primary. */
export function LandingHeader() {
  return (
    // Sticky, so "Sign in" stays in reach. Opaque `surface`, so nothing shows through as the page scrolls under it.
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Wordmark />
        <ButtonLink variant="ghost" to="/login">
          Sign in
        </ButtonLink>
      </div>
    </header>
  );
}
