export interface NotificationPreferences {
  soundEnabled: boolean;
  badgeEnabled: boolean;
}

export const NOTIFICATION_PREFS_KEY = 'weakchat:notification-prefs';
const BASE_TITLE = 'WeakChat';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  soundEnabled: true,
  badgeEnabled: true,
};

export function readNotificationPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled:
        typeof parsed?.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_NOTIFICATION_PREFS.soundEnabled,
      badgeEnabled:
        typeof parsed?.badgeEnabled === 'boolean'
          ? parsed.badgeEnabled
          : DEFAULT_NOTIFICATION_PREFS.badgeEnabled,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/**
 * Plays a short synthesized tone for a new message — no audio asset
 * needed. Respects the sound preference and only fires when the tab
 * isn't the one currently focused (a message you're looking at doesn't
 * need a sound on top of it).
 *
 * Call this from wherever new incoming messages are detected.
 */
export function playMessageSound() {
  if (typeof document === 'undefined' || document.visibilityState === 'visible') return;
  if (!readNotificationPrefs().soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  } catch {
    // Sound is a nice-to-have — never worth breaking the message pipeline.
  }
}

/**
 * Reflects an unread count in the tab title, e.g. "(3) WeakChat". Pass 0
 * (or call whenever the real count drops to 0) to clear it. Respects the
 * badge preference.
 *
 * BASE_TITLE is hardcoded rather than read from document.title at import
 * time — reading it live would be fragile depending on module load order
 * versus other title mutations. Update the constant if the app's actual
 * page title differs.
 */
export function updateTabBadge(unreadCount: number) {
  if (typeof document === 'undefined') return;
  if (!readNotificationPrefs().badgeEnabled || unreadCount <= 0) {
    document.title = BASE_TITLE;
    return;
  }
  document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${BASE_TITLE}`;
}