import { useChatPreferences, type TimestampFormat } from '@/context/ChatPreferencesContext';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { SettingsSection } from './SettingsSection';

const TIMESTAMP_OPTIONS: { value: TimestampFormat; label: string }[] = [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' },
];

export function ChatPreferencesSection() {
    const { timestampFormat, setTimestampFormat, readReceipts, setReadReceipts } = useChatPreferences();

    return (
        <SettingsSection id="chat-preferences-heading" title="Chat preferences" description="How messages are displayed">
            <SegmentedControl
                label="Timestamp format"
                options={TIMESTAMP_OPTIONS}
                value={timestampFormat}
                onChange={setTimestampFormat}
            />
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
        </SettingsSection>
    );
}
