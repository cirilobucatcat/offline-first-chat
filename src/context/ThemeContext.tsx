import {
    createContext,
    useCallback,
    useContext,
    useEffect,
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

function resolveTheme(preference: ThemePreference): ResolvedTheme {
    return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;
}

interface ThemeContextValue {
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference));

    // Keep <html>'s dark class in sync with the resolved theme. The inline
    // script in index.html already set the correct class before mount — this
    // just keeps it correct after any later change.
    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }, [resolvedTheme]);

    useEffect(() => {
        setResolvedTheme(resolveTheme(preference));
    }, [preference]);

    // While on "system", stay in sync if the OS theme changes mid-session.
    useEffect(() => {
        if (preference !== 'system') return;
        const mql = window.matchMedia(DARK_MEDIA_QUERY);
        const handleChange = () => setResolvedTheme(systemPrefersDark() ? 'dark' : 'light');
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, [preference]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Preference just won't persist across reloads — not worth
            // surfacing as an error for a non-critical local setting.
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
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