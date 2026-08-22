import { Volume2, Bell } from 'lucide-react';
import { COLOR } from '@/lib/constants';
import { Toggle } from '@/components/ui/Toggle';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationsSection() {
  const { soundEnabled, badgeEnabled, setSoundEnabled, setBadgeEnabled } =
    useNotificationPreferences();

  return (
    <section
      className='rounded-2xl border p-5 md:p-6 space-y-5'
      style={{ backgroundColor: COLOR.white, borderColor: COLOR.hairline }}
      aria-labelledby='notifications-heading'
    >
      <div>
        <h2
          id='notifications-heading'
          className='text-sm font-semibold uppercase text-primary'
          style={{ letterSpacing: '0.04em' }}
        >
          Notifications
        </h2>
        <p className='text-muted text-sm'>
          How WeakChat lets you know about new messages on this device
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div
          className='flex items-center justify-between gap-4 rounded-xl px-4 py-3'
          style={{ border: `1px solid ${COLOR.hairline}` }}
        >
          <div className='flex items-start gap-3 min-w-0'>
            <Volume2
              size={18}
              aria-hidden='true'
              className='shrink-0 mt-0.5'
              style={{ color: COLOR.primary }}
            />
            <div className='min-w-0'>
              <p className='text-sm font-medium' style={{ color: COLOR.ink }}>
                Message sound
              </p>
              <p className='text-xs mt-0.5' style={{ color: COLOR.muted }}>
                Play a sound for new messages when this tab isn't focused
              </p>
            </div>
          </div>
          <Toggle
            id='sound-toggle'
            checked={soundEnabled}
            onChange={setSoundEnabled}
            label='Message sound'
          />
        </div>

        <div
          className='flex items-center justify-between gap-4 rounded-xl px-4 py-3'
          style={{ border: `1px solid ${COLOR.hairline}` }}
        >
          <div className='flex items-start gap-3 min-w-0'>
            <Bell
              size={18}
              aria-hidden='true'
              className='shrink-0 mt-0.5'
              style={{ color: COLOR.primary }}
            />
            <div className='min-w-0'>
              <p className='text-sm font-medium' style={{ color: COLOR.ink }}>
                Unread badge in tab title
              </p>
              <p className='text-xs mt-0.5' style={{ color: COLOR.muted }}>
                Show your unread count in the browser tab, e.g. "(3) WeakChat"
              </p>
            </div>
          </div>
          <Toggle
            id='badge-toggle'
            checked={badgeEnabled}
            onChange={setBadgeEnabled}
            label='Unread badge in tab title'
          />
        </div>
      </div>

      <div
        className='flex gap-3 rounded-xl px-4 py-3'
        style={{ backgroundColor: COLOR.paleBlue }}
      >
        <p className='text-xs' style={{ color: COLOR.ink }}>
          These only work on this device, and only while WeakChat is open in a
          tab. Notifications when the app or browser is fully closed aren't
          supported yet.
        </p>
      </div>
    </section>
  );
}
