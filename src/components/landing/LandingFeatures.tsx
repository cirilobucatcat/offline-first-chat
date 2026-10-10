import type { ReactNode } from 'react';
import type { Delivery } from '@/types/chats';
import { DeliveryStatus } from '../chats/DeliveryStatus';
import { Icon, type IconName } from '../ui/Icon';

// The states the app produces that hold still. `sending` is left out: its clock hand turns,
// and nothing on this page is in progress.
const DELIVERY_LEGEND: Delivery[] = ['queued', 'sent', 'read'];

interface FeatureProps {
  /** Decorative: the title beside it says the same thing. */
  icon: IconName;
  title: string;
  children: ReactNode;
}

// Each glyph keeps the meaning it has in the app: cloud-off is offline, lock is end-to-end
// encryption, and monitor is a linked device. The tile is neutral, so "Create your account" stays the
// page's one brand accent.
function Feature({ icon, title, children }: FeatureProps) {
  return (
    <li className="rounded-md border border-line bg-surface p-4 md:p-5">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-fill text-ink">
        <Icon name={icon} />
      </span>
      <h3 className="mt-3 text-headline text-ink">{title}</h3>
      {children}
    </li>
  );
}

function FeatureCopy({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-subhead text-ink-muted">{children}</p>;
}

/** What the app does, in four cards. Each claim stops where the app does. */
export function LandingFeatures() {
  return (
    <section aria-labelledby="features-heading" className="mx-auto w-full max-w-5xl px-4 py-12">
      <h2 id="features-heading" className="text-title text-ink">
        What WeakChat does
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        <Feature icon="cloud-off" title="Works offline">
          <FeatureCopy>
            Read your chats and keep writing with no connection. Messages are saved on your device and send when
            you're back.
          </FeatureCopy>
        </Feature>

        <Feature icon="lock" title="End-to-end encrypted direct messages">
          <FeatureCopy>
            Direct messages stay between you and the person you're writing to. Not even WeakChat can read them.
            Group chats are not end-to-end encrypted yet.
          </FeatureCopy>
        </Feature>

        <Feature icon="send" title="Always know where a message is">
          <FeatureCopy>Every message you send shows where it is.</FeatureCopy>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {DELIVERY_LEGEND.map((status) => (
              <li key={status} className="flex">
                <DeliveryStatus status={status} showLabel />
              </li>
            ))}
          </ul>
        </Feature>

        <Feature icon="monitor" title="Use more than one device">
          <FeatureCopy>Link another phone or computer with a code from a device you already use.</FeatureCopy>
        </Feature>
      </ul>
    </section>
  );
}
