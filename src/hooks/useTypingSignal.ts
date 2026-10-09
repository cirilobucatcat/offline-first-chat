import { useCallback, useEffect, useRef } from 'react';
import { clearTyping, setTyping } from '@/lib/chat';
import { TYPING_IDLE_MS, TYPING_REFRESH_MS } from '@/lib/typing';

/**
 * Tells the other people in a conversation that this person is typing.
 *
 * `enabled` is false while offline or with the setting off, and then nothing
 * is announced. A clear still goes out for an announcement already made.
 */
export function useTypingSignal(conversationId: string, uid: string | null, enabled: boolean) {
  // When this device last announced. null when no announcement is out.
  const announcedAt = useRef<number | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Forgets the announcement without a write, for when a sent message has cleared it. */
  const reset = useCallback(() => {
    clearTimeout(idleTimer.current);
    announcedAt.current = null;
  }, []);

  const stop = useCallback(() => {
    const announced = announcedAt.current !== null;
    reset();
    if (!announced || !uid) return;
    clearTyping(conversationId, uid).catch((err) => {
      console.error('Failed to clear typing status', err);
    });
  }, [conversationId, uid, reset]);

  /** Call on each change that leaves text in the field. */
  const keystroke = useCallback(() => {
    if (!uid) return;
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);

    if (!enabled) return;
    const now = Date.now();
    if (announcedAt.current !== null && now - announcedAt.current < TYPING_REFRESH_MS) return;
    announcedAt.current = now;
    // Not awaited: a Firestore write does not resolve until the server has it.
    setTyping(conversationId, uid).catch((err) => {
      console.error('Failed to send typing status', err);
    });
  }, [conversationId, uid, enabled, stop]);

  // Leaving the chat or closing the tab ends it. A tab that dies without
  // getting here is covered by the reader's TTL.
  useEffect(() => {
    window.addEventListener('pagehide', stop);
    return () => {
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, [stop]);

  return { keystroke, stop, reset };
}
