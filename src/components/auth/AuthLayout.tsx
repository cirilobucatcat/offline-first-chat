import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router';
import { AuthPattern } from './AuthPattern';

/** The shared ground of sign-in and sign-up. It stays mounted when one page links to the other. */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-surface px-4 py-12 text-ink">
      <AuthPattern />
      <main className="auth-clearing relative flex w-full max-w-[26rem] flex-col gap-6 p-6">
        <p className="text-title text-ink">WeakChat</p>
        <Outlet />
        <p className="text-center text-footnote text-balance text-ink-muted">
          Direct messages are end-to-end encrypted. Group chats are not yet.
        </p>
      </main>
    </div>
  );
}

interface AuthSwitchProps {
  /** The question before the link, such as "New to WeakChat?". */
  prompt: string;
  to: string;
  children: ReactNode;
}

/** The line under a form that leads to the other auth page. */
export function AuthSwitch({ prompt, to, children }: AuthSwitchProps) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-0 text-subhead text-ink-muted">
      {prompt}
      <Link
        to={to}
        className="group focus-ring inline-flex min-h-hit items-center rounded-full px-2 font-semibold text-brand transition-colors duration-200 hover:text-brand-pressed motion-reduce:transition-none"
      >
        <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-current after:transition-transform after:duration-200 after:ease-out group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100 motion-reduce:after:transition-none">
          {children}
        </span>
      </Link>
    </p>
  );
}
