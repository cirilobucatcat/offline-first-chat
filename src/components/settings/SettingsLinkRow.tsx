import { Icon } from '@/components/ui/Icon';

interface SettingsLinkRowProps {
  label: string;
  description?: string;
  onClick: () => void;
}

/** A settings row that opens a sheet. The negative margin lines its text up with the card's. */
export function SettingsLinkRow({ label, description, onClick }: SettingsLinkRowProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-haspopup='dialog'
      className='focus-ring -mx-3 flex min-h-hit cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-fill'
    >
      <span className='min-w-0'>
        <span className='block text-row-title text-ink'>{label}</span>
        {description && <span className='mt-0.5 block text-footnote text-ink-muted'>{description}</span>}
      </span>
      <Icon name='chevron-right' size={20} className='text-ink-muted' />
    </button>
  );
}
