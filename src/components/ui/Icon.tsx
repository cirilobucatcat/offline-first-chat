import {
  Bell,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Info,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Settings,
  Sun,
  Trash2,
  User,
  UserPlus,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/helpers';

/**
 * The WeakChat icon set: 24px grid, 1.75 stroke, round caps and joins.
 * Some have fixed meanings: `lock` is for the encryption notice only,
 * `shield-check` a verified contact, `key` a safety-number change,
 * `cloud-off` offline, `clock` waiting on this device.
 */
const GLYPHS = {
  send: (
    <>
      <path d="M20.5 3.5 3.5 10.6l6.8 3.1 3.1 6.8z" />
      <path d="M10.3 13.7 20.5 3.5" />
    </>
  ),
  attach: (
    <path d="M19.5 11.6 12 19.1a5 5 0 0 1-7.1-7.1l7.9-7.9a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.65 1.65 0 0 1-2.35-2.35L14.6 7.1" />
  ),
  mic: (
    <>
      <rect x={9} y={3} width={6} height={11} rx={3} />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  smile: (
    <>
      <circle cx={12} cy={12} r={9} />
      <path d="M8.5 14.2a4.2 4.2 0 0 0 7 0" />
      <circle cx={9.2} cy={9.6} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={14.8} cy={9.6} r={1.1} fill="currentColor" stroke="none" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.4l1.6-2.5h5l1.6 2.5h2.4A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx={12} cy={12.8} r={3.4} />
    </>
  ),
  lock: (
    <>
      <rect x={5} y={10.5} width={14} height={10} rx={2.5} />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 3 19 6v5.6c0 4.3-2.9 7.9-7 9.4-4.1-1.5-7-5.1-7-9.4V6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  key: (
    <>
      <circle cx={7.5} cy={15.5} r={3.5} />
      <path d="M10 13 19 4" />
      <path d="m16 7 2.2 2.2" />
      <path d="m13.6 9.4 1.6 1.6" />
    </>
  ),
  timer: (
    <>
      <circle cx={12} cy={13.5} r={7.5} />
      <path d="M12 10v3.5l2.3 1.4" />
      <path d="M9.5 3h5" />
      <path d="m18.2 6.8 1.3-1.3" />
    </>
  ),
  clock: (
    <>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'check-double': (
    <>
      <path d="m2.5 12.5 4.5 4.5 9-9.5" />
      <path d="m11.6 16.4.6.6 9.3-9.5" />
    </>
  ),
  alert: (
    <>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 7.5v5.5" />
      <circle cx={12} cy={16.4} r={1.1} fill="currentColor" stroke="none" />
    </>
  ),
  'cloud-off': (
    <>
      <path d="M3 3l18 18" />
      <path d="M9 5.6A6 6 0 0 1 17.6 10a4.3 4.3 0 0 1 3 6.6" />
      <path d="M17.4 19H7a4.5 4.5 0 0 1-1.3-8.8" />
    </>
  ),
  sync: (
    <>
      <path d="M19.5 10.5A7.7 7.7 0 0 0 5.6 7.6L4 9.5" />
      <path d="M4 4.5v5h5" />
      <path d="M4.5 13.5a7.7 7.7 0 0 0 13.9 2.9l1.6-1.9" />
      <path d="M20 19.5v-5h-5" />
    </>
  ),
  search: (
    <>
      <circle cx={10.8} cy={10.8} r={6.3} />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  compose: (
    <>
      <path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  back: <path d="M15 4.5 7.5 12l7.5 7.5" />,
  more: (
    <>
      <circle cx={12} cy={5.5} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={12} cy={12} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={12} cy={18.5} r={1.5} fill="currentColor" stroke="none" />
    </>
  ),
  phone: (
    <path d="M5.2 4h3.3l1.7 4.3-2.1 1.3a10.8 10.8 0 0 0 6.3 6.3l1.3-2.1 4.3 1.7v3.3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.7 5.6 1.5 1.5 0 0 1 5.2 4z" />
  ),
  video: (
    <>
      <rect x={3} y={6.5} width={12.5} height={11} rx={2.5} />
      <path d="m15.5 10.5 5-3v9l-5-3" />
    </>
  ),
  pin: (
    <>
      <path d="M9 3.5h6l-1 5.5 3 3V14H7v-2l3-3z" />
      <path d="M12 14v6.5" />
    </>
  ),
  'bell-off': (
    <>
      <path d="M6.6 6.6A6 6 0 0 0 6 9.3c0 4.9-2 6.7-2 6.7h12" />
      <path d="M9.4 3.9A6 6 0 0 1 18 9.3c0 2.3.4 3.9.9 5" />
      <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </>
  ),
  reply: (
    <>
      <path d="M10 7.5 4.5 12.5l5.5 5" />
      <path d="M4.5 12.5H14a6 6 0 0 1 6 6v1" />
    </>
  ),
};

/** Glyphs the design system does not draw yet, taken from lucide at the same stroke. */
const EXTRA = {
  close: X,
  'chevron-right': ChevronRight,
  settings: Settings,
  'log-out': LogOut,
  eye: Eye,
  'eye-off': EyeOff,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  user: User,
  users: Users,
  'user-plus': UserPlus,
  mail: Mail,
  copy: Copy,
  trash: Trash2,
  bell: Bell,
  volume: Volume2,
  info: Info,
};

type ExtraName = keyof typeof EXTRA;
export type IconName = keyof typeof GLYPHS | ExtraName;

interface IconProps {
  name: IconName;
  /** Pixel size. 24 by default, 20 in dense controls, 16 inline with caption text. */
  size?: number;
  /** Accessible name. Leave out for decorative icons. */
  label?: string;
  /** Turn continuously. Only for `sync`; stops under reduced motion. */
  spin?: boolean;
  className?: string;
}

export function Icon({ name, size = 24, label, spin = false, className }: IconProps) {
  const classes = cn('inline-block shrink-0 align-middle', spin && 'motion-safe:animate-spin', className);
  const a11y = label ? ({ role: 'img', 'aria-label': label } as const) : ({ 'aria-hidden': true } as const);

  if (name in EXTRA) {
    const Glyph = EXTRA[name as ExtraName];
    return <Glyph size={size} strokeWidth={1.75} focusable="false" className={classes} {...a11y} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={classes}
      {...a11y}
    >
      {GLYPHS[name as keyof typeof GLYPHS]}
    </svg>
  );
}
