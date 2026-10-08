import { useId } from 'react';
import { cn } from '@/lib/helpers';
import type { Delivery } from '@/types/chats';

const LABEL: Record<Delivery, string> = {
  queued: 'Waiting for network',
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

interface DeliveryStatusProps {
  status: Delivery;
  /** `bubble` when drawn inside an outgoing bubble. */
  tone?: 'surface' | 'bubble';
  /** Print the word beside the glyph. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Where your own message is, as a 16px glyph. Each state has its own shape,
 * so it never rests on colour alone. `queued` is normal, not an error.
 */
export function DeliveryStatus({ status, tone = 'surface', showLabel = false, className }: DeliveryStatusProps) {
  const maskId = `wc-read-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

  const colour =
    tone === 'bubble'
      ? status === 'read' ? 'text-on-bubble-out' : 'text-bubble-out-meta'
      : status === 'read' ? 'text-brand' : status === 'failed' ? 'text-danger' : 'text-ink-muted';

  return (
    <span
      role="img"
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className={cn('inline-flex shrink-0 items-center gap-1', colour, className)}
    >
      <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="block shrink-0">
        {(status === 'queued' || status === 'sending') && (
          <>
            <circle cx={8} cy={8} r={6.2} {...STROKE} />
            <path
              d="M8 4.9V8l2.1 1.3"
              {...STROKE}
              className={status === 'sending' ? 'origin-[8px_8px] motion-safe:animate-clock-hand' : undefined}
            />
          </>
        )}
        {status === 'sent' && <path d="M3.5 8.4 6.6 11.5 12.6 5" {...STROKE} />}
        {status === 'delivered' && (
          <>
            <path d="M1.4 8.4 4.5 11.5 10.5 5" {...STROKE} />
            <path d="M8.3 10.9 8.9 11.5 14.9 5" {...STROKE} />
          </>
        )}
        {status === 'read' && (
          <>
            {/* Mask values, not colours: white keeps the pill, black cuts the checks out. */}
            <mask id={maskId}>
              <rect x={0} y={0} width={16} height={16} fill="white" />
              <path d="M2.9 8.3 5.3 10.7 10 5.9" {...STROKE} stroke="black" />
              <path d="M8.5 10.1 9.1 10.7 13.6 5.9" {...STROKE} stroke="black" />
            </mask>
            <rect x={0} y={2} width={16} height={12} rx={6} fill="currentColor" mask={`url(#${maskId})`} />
          </>
        )}
        {status === 'failed' && (
          <>
            <circle cx={8} cy={8} r={6.2} {...STROKE} />
            <path d="M8 4.9v3.6" {...STROKE} />
            <circle cx={8} cy={11.1} r={0.95} fill="currentColor" />
          </>
        )}
      </svg>
      {showLabel && <span className="text-caption">{LABEL[status]}</span>}
    </span>
  );
}
