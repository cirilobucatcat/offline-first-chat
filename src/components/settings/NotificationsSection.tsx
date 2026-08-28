import { Volume2, Bell } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationsSection() {
  const { soundEnabled, badgeEnabled, setSoundEnabled, setBadgeEnabled } =
    useNotificationPreferences();

  return (
    <section
      className='rounded-2xl border border-hairline dark:border-hairline-dark bg-white dark:bg-surface p-5 md:p-6 space-y-5'
      aria-labelledby='notifications-heading'
    >
      <div>
        <h2 id='notifications-heading' className='text-sm font-semibold uppercase text-primary dark:text-accent' style={{ letterSpacing: '0.04em' }}>
          Notifications
        </h2>
        <p className='text-muted dark:text-mist text-sm'>
          How WeakChat lets you know about new messages on this device
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-4 rounded-xl px-4 py-3 border border-hairline dark:border-hairline-dark'>
          <div className='flex items-start gap-3 min-w-0'>
            <Volume2 size={18} aria-hidden='true' className='shrink-0 mt-0.5 text-primary dark:text-accent' />
            <div className='min-w-0'>
              <p className='text-sm font-medium text-ink dark:text-pale-blue'>Message sound</p>
              <p className='text-xs mt-0.5 text-muted dark:text-mist'>
                Play a sound for new messages when this tab isn't focused
              </p>
            </div>
          </div>
          <Toggle id='sound-toggle' checked={soundEnabled} onChange={setSoundEnabled} label='Message sound' />
        </div>

        <div className='flex items-center justify-between gap-4 rounded-xl px-4 py-3 border border-hairline dark:border-hairline-dark'>
          <div className='flex items-start gap-3 min-w-0'>
            <Bell size={18} aria-hidden='true' className='shrink-0 mt-0.5 text-primary dark:text-accent' />
            <div className='min-w-0'>
              <p className='text-sm font-medium text-ink dark:text-pale-blue'>Unread badge in tab title</p>
              <p className='text-xs mt-0.5 text-muted dark:text-mist'>
                Show your unread count in the browser tab, e.g. "(3) WeakChat"
              </p>
            </div>
          </div>
          <Toggle id='badge-toggle' checked={badgeEnabled} onChange={setBadgeEnabled} label='Unread badge in tab title' />
        </div>
      </div>

      <div className='flex gap-3 rounded-xl px-4 py-3 bg-pale-blue dark:bg-accent/10'>
        <p className='text-xs text-ink dark:text-pale-blue'>
          These only work on this device, and only while WeakChat is open in a
          tab. Notifications when the app or browser is fully closed aren't
          supported yet.
        </p>
      </div>
    </section>
  );
}