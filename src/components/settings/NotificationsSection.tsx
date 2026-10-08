import { Notice } from '@/components/ui/Notice';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { SettingsSection } from './SettingsSection';

export function NotificationsSection() {
  const { soundEnabled, badgeEnabled, setSoundEnabled, setBadgeEnabled } =
    useNotificationPreferences();

  return (
    <SettingsSection
      id='notifications-heading'
      title='Notifications'
      description='How WeakChat lets you know about new messages on this device'
    >
      <ToggleRow
        label='Message sound'
        description="Play a sound for new messages when this tab isn't focused"
        checked={soundEnabled}
        onChange={setSoundEnabled}
      />
      <ToggleRow
        label='Unread badge in tab title'
        description='Show your unread count in the browser tab, e.g. "(3) WeakChat"'
        checked={badgeEnabled}
        onChange={setBadgeEnabled}
      />
      <Notice>
        These only work on this device, and only while WeakChat is open in a
        tab. Notifications when the app or browser is fully closed aren't
        supported yet.
      </Notice>
    </SettingsSection>
  );
}
