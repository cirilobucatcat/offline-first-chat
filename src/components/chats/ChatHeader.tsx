import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import type { NetworkStatus } from '@/hooks/useNetworkStatus';
import { Avatar } from '../Avatar';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

const CONNECTION_TEXT: Record<Exclude<NetworkStatus, 'online'>, string> = {
  offline: 'Waiting for network…',
  syncing: 'Updating…',
};

interface ChatHeaderProps {
  name: string;
  /** Stable key for the avatar tint. */
  id: string;
  /** e.g. "4 members". Replaced by the connection state while the app is not online. */
  subtitle?: string;
  connection?: NetworkStatus;
  /** `false` hides the back button, for layouts that show the chat list beside the thread. */
  onBack?: (() => void) | false;
  /** Two actions at most. Everything else goes in the more menu. */
  actions?: ReactNode;
  className?: string;
}

/** The bar at the top of a thread. Inside a thread, its subtitle is where connection state lives. */
export function ChatHeader({ name, id, subtitle, connection = 'online', onBack, actions, className }: ChatHeaderProps) {
  return (
    <header className={cn('flex h-15 shrink-0 items-center gap-2 border-b border-line bg-surface px-1', className)}>
      {/* From md up the chat list sits beside the thread, so there is nowhere to go back to. */}
      {onBack !== false && <IconButton icon="back" label="Back" onClick={onBack} className="text-brand md:hidden" />}
      <Avatar name={name} id={id} size="md" className={onBack === false ? 'ml-3' : 'ml-0.5 md:ml-3'} />
      <div className="ml-1 flex min-w-0 flex-1 flex-col">
        <h2 className="truncate text-headline text-ink">{name}</h2>
        <p aria-live="polite" className="flex min-h-4.5 items-center gap-1 text-footnote text-ink-muted">
          {connection === 'online' ? (
            subtitle
          ) : (
            <>
              {connection === 'offline' ? <Icon name="cloud-off" size={14} /> : <Icon name="sync" size={14} spin />}
              {CONNECTION_TEXT[connection]}
            </>
          )}
        </p>
      </div>
      {actions && <div className="flex shrink-0">{actions}</div>}
    </header>
  );
}
