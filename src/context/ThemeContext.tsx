import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'weakchat:theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

function readStoredPreference(): ThemePreference {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // localStorage unavailable (private browsing, disabled storage) —
        // fall back to system rather than throwing.
    }
    return 'system';
}

function systemPrefersDark(): boolean {
    return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

interface ThemeContextValue {
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
    const [systemDark, setSystemDark] = useState(systemPrefersDark);
    const resolvedTheme: ResolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

    // Keep <html>'s dark class in sync with the resolved theme. The inline
    // script in index.html already set the correct class before mount — this
    // just keeps it correct after any later change.
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', resolvedTheme === 'dark');
        // The browser chrome follows the surface token, read back so the value lives in one place.
        const surface = getComputedStyle(root).getPropertyValue('--color-surface').trim();
        if (surface) {
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
        }
    }, [resolvedTheme]);

    // Stay in sync if the OS theme changes mid-session. It only shows while on "system".
    useEffect(() => {
        const mql = window.matchMedia(DARK_MEDIA_QUERY);
        const handleChange = () => setSystemDark(mql.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Preference just won't persist across reloads — not worth
            // surfacing as an error for a non-critical local setting.
        }
    }, []);

    const value = useMemo(
        () => ({ preference, resolvedTheme, setPreference }),
        [preference, resolvedTheme, setPreference],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}