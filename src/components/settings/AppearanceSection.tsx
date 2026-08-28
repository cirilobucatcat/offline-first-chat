import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { useAppearance, type TextSize, type MessageDensity } from '@/context/AppearanceContext';
import { ToggleRow } from '@/components/ui/ToggleRow';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
];

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
];

const DENSITY_OPTIONS: { value: MessageDensity; label: string }[] = [
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'compact', label: 'Compact' },
];

function segmentClasses(active: boolean) {
    return `wc-focus flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${active
            ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent'
            : 'border-hairline dark:border-hairline-dark text-muted dark:text-mist'
        }`;
}

export function AppearanceSection() {
    const { preference, setPreference } = useTheme();
    const { textSize, setTextSize, reduceMotion, setReduceMotion, messageDensity, setMessageDensity } = useAppearance();

    return (
        <section
            className="rounded-2xl border border-hairline dark:border-hairline-dark bg-white dark:bg-surface p-5 md:p-6 space-y-6"
            aria-labelledby="appearance-heading"
        >
            <div>
                <h2 id="appearance-heading" className="text-sm font-semibold uppercase text-primary dark:text-accent" style={{ letterSpacing: '0.04em' }}>
                    Appearance
                </h2>
                <p className="text-sm text-muted dark:text-mist">How WeakChat looks on this device</p>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-ink dark:text-pale-blue">Theme</p>
                <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button key={value} type="button" role="radio" aria-checked={preference === value} onClick={() => setPreference(value)} className={segmentClasses(preference === value)}>
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-xs text-muted dark:text-mist">System matches your device's setting automatically.</p>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-ink dark:text-pale-blue">Text size</p>
                <div role="radiogroup" aria-label="Text size" className="grid grid-cols-3 gap-2">
                    {TEXT_SIZE_OPTIONS.map(({ value, label }) => (
                        <button key={value} type="button" role="radio" aria-checked={textSize === value} onClick={() => setTextSize(value)} className={segmentClasses(textSize === value)}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-ink dark:text-pale-blue">Message density</p>
                <div role="radiogroup" aria-label="Message density" className="grid grid-cols-2 gap-2">
                    {DENSITY_OPTIONS.map(({ value, label }) => (
                        <button key={value} type="button" role="radio" aria-checked={messageDensity === value} onClick={() => setMessageDensity(value)} className={segmentClasses(messageDensity === value)}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <ToggleRow label="Reduce motion" description="Minimize animations and transitions" checked={reduceMotion} onChange={setReduceMotion} />
        </section>
    );
}