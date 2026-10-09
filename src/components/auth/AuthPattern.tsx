import { useId } from 'react';

/** The WeakMite sprite, one character per pixel. Any non-dot is solid, so the eyes stay cut out. */
const SPRITE = [
  '...XX...X...XX..',
  '....X...X...X...',
  '.....X..X..X....',
  '......X.X.X.....',
  '......XXXX......',
  '.....XXXXXX.....',
  'XXXXXXXXXXXXXXXX',
  '...XX..XX..XX...',
  '...XX..XX..XX...',
  '...XXXXXXXXXX...',
  '...XXXXXXXXXX...',
  '....XXXXXXXX....',
  '.....XXXXXX.....',
];

/** How far the noodles lean, in degrees counter-clockwise from flat. */
const TILT = 50;

/** The size of one sprite pixel, in px. */
const CELL = 1.75;

/** The sprite as one path of horizontal runs. */
const SPRITE_PATH = SPRITE.flatMap((row, y) =>
  [...row.matchAll(/X+/g)].map(
    (run) => `M${run.index * CELL} ${y * CELL}h${run[0].length * CELL}v${CELL}h${-run[0].length * CELL}z`,
  ),
).join('');

/**
 * The ground behind sign-in and sign-up: short noodles and small WeakMites scattered over the page.
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
        <pattern id={id} width={176} height={132} patternUnits="userSpaceOnUse" patternTransform={`rotate(${-TILT})`}>
          <g fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 26q5-8 10 0t10 0 10 0 10 0" />
            <path d="M82 54q5-8 10 0t10 0 10 0" />
            <path d="M24 92q5-8 10 0t10 0 10 0 10 0 10 0" />
            <path d="M96 114q5-8 10 0t10 0" />
          </g>
          {/* Turned back by TILT so the sprite stands upright inside the leaning tile. */}
          <path
            fill="currentColor"
            shapeRendering="crispEdges"
            transform={`translate(152 66) rotate(${TILT}) translate(${-8 * CELL} ${-6.5 * CELL})`}
            d={SPRITE_PATH}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
