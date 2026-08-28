import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

export type TextSize = 'sm' | 'md' | 'lg';
export type MessageDensity = 'compact' | 'comfortable';

const TEXT_SIZE_KEY = 'weakchat:textSize';
const REDUCE_MOTION_KEY = 'weakchat:reduceMotion';
const MESSAGE_DENSITY_KEY = 'weakchat:messageDensity';

function readTextSize(): TextSize {
    try {
        const stored = localStorage.getItem(TEXT_SIZE_KEY);
        if (stored === 'sm' || stored === 'md' || stored === 'lg') return stored;
    } catch {
        // ignore — falls through to default
    }
    return 'md';
}

function readReduceMotion(): boolean {
    try {
        const stored = localStorage.getItem(REDUCE_MOTION_KEY);
        if (stored === 'true') return true;
        if (stored === 'false') return false;
        // No explicit choice yet — seed from the OS preference once, rather
        // than defaulting everyone to "off" regardless of their system setting.
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
}

function readMessageDensity(): MessageDensity {
    try {
        const stored = localStorage.getItem(MESSAGE_DENSITY_KEY);
        if (stored === 'compact' || stored === 'comfortable') return stored;
    } catch {
        // ignore
    }
    return 'comfortable';
}

interface AppearanceContextValue {
    textSize: TextSize;
    setTextSize: (size: TextSize) => void;
    reduceMotion: boolean;
    setReduceMotion: (value: boolean) => void;
    messageDensity: MessageDensity;
    setMessageDensity: (density: MessageDensity) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [textSize, setTextSizeState] = useState<TextSize>(readTextSize);
    const [reduceMotion, setReduceMotionState] = useState<boolean>(readReduceMotion);
    const [messageDensity, setMessageDensityState] = useState<MessageDensity>(readMessageDensity);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('text-size-sm', 'text-size-lg');
        if (textSize !== 'md') root.classList.add(`text-size-${textSize}`);
    }, [textSize]);

    useEffect(() => {
        document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    }, [reduceMotion]);

    const setTextSize = useCallback((size: TextSize) => {
        setTextSizeState(size);
        try {
            localStorage.setItem(TEXT_SIZE_KEY, size);
        } catch {
            // Preference won't persist across reloads — not worth surfacing as
            // an error for a non-critical local setting.
        }
    }, []);

    const setReduceMotion = useCallback((value: boolean) => {
        setReduceMotionState(value);
        try {
            localStorage.setItem(REDUCE_MOTION_KEY, String(value));
        } catch {
            // same as above
        }
    }, []);

    const setMessageDensity = useCallback((density: MessageDensity) => {
        setMessageDensityState(density);
        try {
            localStorage.setItem(MESSAGE_DENSITY_KEY, density);
        } catch {
            // same as above
        }
    }, []);

    return (
        <AppearanceContext.Provider
            value={{ textSize, setTextSize, reduceMotion, setReduceMotion, messageDensity, setMessageDensity }}
        >
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance(): AppearanceContextValue {
    const ctx = useContext(AppearanceContext);
    if (!ctx) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return ctx;
}