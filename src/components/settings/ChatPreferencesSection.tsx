import { useChatPreferences, type TimestampFormat } from '@/context/ChatPreferencesContext';
import { ToggleRow } from '@/components/ui/ToggleRow';

const TIMESTAMP_OPTIONS: { value: TimestampFormat; label: string }[] = [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' },
];

export function ChatPreferencesSection() {
    const { timestampFormat, setTimestampFormat, readReceipts, setReadReceipts } = useChatPreferences();

    return (
        <section
            className="rounded-2xl border border-hairline dark:border-hairline-dark bg-white dark:bg-surface p-5 md:p-6 space-y-5"
            aria-labelledby="chat-preferences-heading"
        >
            <div>
                <h2 id="chat-preferences-heading" className="text-sm font-semibold uppercase text-primary dark:text-accent" style={{ letterSpacing: '0.04em' }}>
                    Chat Preferences
                </h2>
                <p className="text-sm text-muted dark:text-mist">How messages are displayed</p>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-ink dark:text-pale-blue">Timestamp format</p>
                <div role="radiogroup" aria-label="Timestamp format" className="grid grid-cols-2 gap-2">
                    {TIMESTAMP_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={timestampFormat === value}
                            onClick={() => setTimestampFormat(value)}
                            className={`wc-focus rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${timestampFormat === value
                                    ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent'
                                    : 'border-hairline dark:border-hairline-dark text-muted dark:text-mist'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <ToggleRow
                label="Read receipts"
                description={
                    readReceipts
                        ? "Others can see when you've read their messages"
                        : "Others won't see when you've read their messages — your own unread badges still clear normally"
                }
                checked={readReceipts}
                onChange={setReadReceipts}
            />
        </section>
    );
}