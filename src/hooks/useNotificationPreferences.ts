import { useCallback, useEffect, useState } from 'react';

export interface NotificationPreferences {
  soundEnabled: boolean;
  badgeEnabled: boolean;
}

const STORAGE_KEY = 'weakchat:notification-prefs';

const DEFAULT_PREFS: NotificationPreferences = {
  soundEnabled: true,
  badgeEnabled: true,
};

function readPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_PREFS.soundEnabled,
      badgeEnabled:
        typeof parsed.badgeEnabled === 'boolean'
          ? parsed.badgeEnabled
          : DEFAULT_PREFS.badgeEnabled,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Local, per-device notification preferences. Deliberately NOT synced via
 * Firestore — see file header note on why that's correct here, not an
 * oversight.
 */
export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(readPrefs);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Private browsing / quota exceeded — preference just won't persist
      // across reloads. Not worth surfacing an error for.
    }
  }, [prefs]);

  // Stay in sync if changed in another tab of the same browser.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setPrefs(readPrefs());
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
