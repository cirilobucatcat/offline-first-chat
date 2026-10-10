import { Timestamp } from 'firebase/firestore';
import { formatMessageTime } from '@/lib/chat';
import { useChatPreferences } from '@/context/ChatPreferencesContext';
import { AuthPattern } from '../auth/AuthPattern';
import { ChatHeader } from '../chats/ChatHeader';
import { MessageBubble } from '../chats/MessageBubble';
import { SystemNotice } from '../chats/SystemNotice';

// Fixed moments, so the sample reads the same on every visit. Only the time of day is shown.
const ASKED_AT = Timestamp.fromDate(new Date(2026, 0, 1, 17, 2));
const REPLIED_AT = Timestamp.fromDate(new Date(2026, 0, 1, 17, 3));
const QUEUED_AT = Timestamp.fromDate(new Date(2026, 0, 1, 17, 4));

/**
 * A sample direct chat, built from the thread's own components. It shows only what the app
 * does: the header's offline state, the encryption notice, a read message and one waiting
 * for network. Nothing in it loops, because nothing here is in progress.
 */
export function ThreadPreview() {
  const { timestampFormat } = useChatPreferences();
  const hour12 = timestampFormat === '12h';

  return (
    <figure className="w-full max-w-md md:ml-auto">
      <figcaption className="sr-only">
        A sample direct chat with Mighty. Its header says it is waiting for network. The thread opens with the
        encryption notice, and the last message shows a clock because it has not sent yet.
      </figcaption>
      {/* Hidden from assistive tech and inert: a made-up conversation is not content, and nothing in it works. */}
      <div aria-hidden="true" inert className="overflow-hidden rounded-md border border-line bg-canvas shadow-raised">
        {/* The header agrees with the queued message below: this device is offline. */}
        <ChatHeader name="Mighty" id="mighty" connection="offline" onBack={false} />
        <div className="relative">
          <AuthPattern />
          <div className="relative px-3 pb-3">
            <SystemNotice kind="encryption">
              Messages in this chat stay between you and the people in it. Not even WeakChat can read them.
            </SystemNotice>
            {/* Bubbles stay direct children of the day, because a bubble's spacing depends on its siblings. */}
            <div>
              <SystemNotice kind="date">Today</SystemNotice>
              <MessageBubble direction="in" time={formatMessageTime(ASKED_AT, hour12)}>
                Are you on the ferry yet?
              </MessageBubble>
              <MessageBubble direction="out" position="first" status="read" time={formatMessageTime(REPLIED_AT, hour12)}>
                Boarding now.
              </MessageBubble>
              <MessageBubble direction="out" position="last" status="queued" time={formatMessageTime(QUEUED_AT, hour12)}>
                No signal on the water. See you at six.
              </MessageBubble>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
