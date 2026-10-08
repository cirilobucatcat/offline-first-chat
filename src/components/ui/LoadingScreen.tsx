import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** A full-screen wait, shown before there is a screen to draw. */
export function LoadingScreen({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh w-full items-center justify-center gap-3 bg-surface px-4 text-subhead text-ink-muted"
    >
      <Icon name="sync" spin />
      {children}
    </div>
  );
}
