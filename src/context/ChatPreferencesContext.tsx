import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type TimestampFormat = '12h' | '24h';

const TIMESTAMP_FORMAT_KEY = 'weakchat:timestampFormat';
const READ_RECEIPTS_KEY = 'weakchat:readReceipts';

function readTimestampFormat(): TimestampFormat {
    try {
        const stored = localStorage.getItem(TIMESTAMP_FORMAT_KEY);
        if (stored === '12h' || stored === '24h') return stored;
    } catch {
        // ignore
    }
    return '12h';
}

function readReadReceipts(): boolean {
    try {
        const stored = localStorage.getItem(READ_RECEIPTS_KEY);
        if (stored === 'false') return false;
    } catch {
        // ignore
    }
    return true; // default on — matches current, unconditional behavior
}

interface ChatPreferencesContextValue {
    timestampFormat: TimestampFormat;
    setTimestampFormat: (format: TimestampFormat) => void;
    readReceipts: boolean;
    setReadReceipts: (value: boolean) => void;
}

const ChatPreferencesContext = createContext<ChatPreferencesContextValue | null>(null);

export function ChatPreferencesProvider({ children }: { children: ReactNode }) {
    const [timestampFormat, setTimestampFormatState] = useState<TimestampFormat>(readTimestampFormat);
    const [readReceipts, setReadReceiptsState] = useState<boolean>(readReadReceipts);

    const setTimestampFormat = useCallback((format: TimestampFormat) => {
        setTimestampFormatState(format);
        try {
            localStorage.setItem(TIMESTAMP_FORMAT_KEY, format);
        } catch {
            // Preference won't persist — non-critical local setting.
        }
    }, []);

    const setReadReceipts = useCallback((value: boolean) => {
        setReadReceiptsState(value);
        try {
            localStorage.setItem(READ_RECEIPTS_KEY, String(value));
        } catch {
            // same as above
        }
    }, []);

    return (
        <ChatPreferencesContext.Provider value={{ timestampFormat, setTimestampFormat, readReceipts, setReadReceipts }}>
            {children}
        </ChatPreferencesContext.Provider>
    );
}

export function useChatPreferences(): ChatPreferencesContextValue {
    const ctx = useContext(ChatPreferencesContext);
    if (!ctx) {
        throw new Error('useChatPreferences must be used within a ChatPreferencesProvider');
    }
    return ctx;
}