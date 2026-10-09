import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type TimestampFormat = '12h' | '24h';

const TIMESTAMP_FORMAT_KEY = 'weakchat:timestampFormat';
const READ_RECEIPTS_KEY = 'weakchat:readReceipts';
const TYPING_INDICATORS_KEY = 'weakchat:typingIndicators';

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

function readTypingIndicators(): boolean {
    try {
        const stored = localStorage.getItem(TYPING_INDICATORS_KEY);
        if (stored === 'false') return false;
    } catch {
        // ignore
    }
    return true;
}

interface ChatPreferencesContextValue {
    timestampFormat: TimestampFormat;
    setTimestampFormat: (format: TimestampFormat) => void;
    readReceipts: boolean;
    setReadReceipts: (value: boolean) => void;
    /** Whether others see when you are typing. You see them either way. */
    typingIndicators: boolean;
    setTypingIndicators: (value: boolean) => void;
}

const ChatPreferencesContext = createContext<ChatPreferencesContextValue | null>(null);

export function ChatPreferencesProvider({ children }: { children: ReactNode }) {
    const [timestampFormat, setTimestampFormatState] = useState<TimestampFormat>(readTimestampFormat);
    const [readReceipts, setReadReceiptsState] = useState<boolean>(readReadReceipts);
    const [typingIndicators, setTypingIndicatorsState] = useState<boolean>(readTypingIndicators);

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

    const setTypingIndicators = useCallback((value: boolean) => {
        setTypingIndicatorsState(value);
        try {
            localStorage.setItem(TYPING_INDICATORS_KEY, String(value));
        } catch {
            // same as above
        }
    }, []);

    const value = useMemo(
        () => ({
            timestampFormat,
            setTimestampFormat,
            readReceipts,
            setReadReceipts,
            typingIndicators,
            setTypingIndicators,
        }),
        [timestampFormat, setTimestampFormat, readReceipts, setReadReceipts, typingIndicators, setTypingIndicators],
    );

    return (
        <ChatPreferencesContext.Provider value={value}>
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