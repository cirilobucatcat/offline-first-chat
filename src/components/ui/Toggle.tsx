import { cn } from '@/lib/helpers';

/**
 * The track and thumb on their own, for a row that is itself the switch.
 * State is shown two ways — track colour and thumb position — so it doesn't
 * rely on colour alone. The transparent outlines are what forced-colours mode draws.
 */
export function ToggleTrack({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline outline-transparent transition-colors',
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full shadow-raised outline outline-transparent transition-transform',
          checked ? 'translate-x-5.5 bg-on-brand' : 'translate-x-0.5 bg-surface',
        )}
      />
    </span>
  );
}
