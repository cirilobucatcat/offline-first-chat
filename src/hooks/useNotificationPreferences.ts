import { useCallback, useEffect, useState } from 'react';
import {
  NOTIFICATION_PREFS_KEY,
  readNotificationPrefs,
  type NotificationPreferences,
} from '@/lib/notifications';

export type { NotificationPreferences };

/**
 * Local, per-device notification preferences. Deliberately NOT synced via
 * Firestore — see file header note on why that's correct here, not an
 * oversight.
 */
export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(readNotificationPrefs);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Private browsing / quota exceeded — preference just won't persist
      // across reloads. Not worth surfacing an error for.
    }
  }, [prefs]);

  // Stay in sync if changed in another tab of the same browser.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === NOTIFICATION_PREFS_KEY) setPrefs(readNotificationPrefs());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setSoundEnabled = useCallback((soundEnabled: boolean) => {
    setPrefs((p) => ({ ...p, soundEnabled }));
  }, []);

  const setBadgeEnabled = useCallback((badgeEnabled: boolean) => {
    setPrefs((p) => ({ ...p, badgeEnabled }));
  }, []);

  return { ...prefs, setSoundEnabled, setBadgeEnabled };
}
