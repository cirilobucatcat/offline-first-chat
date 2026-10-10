import { AuthPattern } from '../auth/AuthPattern';
import { ButtonLink } from '../ui/Button';
import { ThreadPreview } from './ThreadPreview';

/** What WeakChat is, and the one thing to do next. */
export function LandingHero() {
  return (
    <section className="relative border-b border-line">
      {/* The pattern fades out under the copy, so the text sits on clear ground: from the left beside it, from the top on a phone. */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_45%,black)] md:[mask-image:linear-gradient(to_right,transparent_40%,black_75%)]">
        <AuthPattern />
      </div>
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-12 md:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-display text-balance text-ink">Your messages wait for you.</h1>
            <p className="max-w-md text-body text-ink-muted">
              WeakChat is a chat app that works without a connection. Read and write offline, and your messages send
              when you're back. Direct messages are end-to-end encrypted.
            </p>
          </div>
          {/* The page's one brand-filled control. */}
          <ButtonLink to="/signup" className="w-full sm:w-auto">
            Create your account
          </ButtonLink>
        </div>
        <ThreadPreview />
      </div>
    </section>
  );
}
