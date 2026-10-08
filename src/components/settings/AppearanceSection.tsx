import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { useAppearance, type TextSize } from '@/context/AppearanceContext';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { SettingsSection } from './SettingsSection';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
];

export function AppearanceSection() {
    const { preference, setPreference } = useTheme();
    const { textSize, setTextSize, reduceMotion, setReduceMotion } = useAppearance();

    return (
        <SettingsSection id="appearance-heading" title="Appearance" description="How WeakChat looks on this device">
            <SegmentedControl
                label="Theme"
                options={THEME_OPTIONS}
                value={preference}
                onChange={setPreference}
                description="System follows your device's setting."
            />
            <SegmentedControl label="Text size" options={TEXT_SIZE_OPTIONS} value={textSize} onChange={setTextSize} />
            <ToggleRow label="Reduce motion" description="Minimize animations and transitions" checked={reduceMotion} onChange={setReduceMotion} />
        </SettingsSection>
    );
}
