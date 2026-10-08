import { useId } from 'react';

/** How far the noodles lean, in degrees counter-clockwise from flat. */
const TILT = 50;

/**
 * The ground behind sign-in and sign-up: short noodles scattered over the page.
 * Decoration only, so it is drawn in `line` and hidden from assistive tech.
 */
export function AuthPattern() {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 size-full text-line forced-colors:hidden"
    >
      <defs>
        <pattern id={id} width={132} height={132} patternUnits="userSpaceOnUse" patternTransform={`rotate(${-TILT})`}>
          <g fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 26q5-8 10 0t10 0 10 0 10 0" />
            <path d="M82 54q5-8 10 0t10 0 10 0" />
            <path d="M24 92q5-8 10 0t10 0 10 0 10 0 10 0" />
            <path d="M96 114q5-8 10 0t10 0" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
