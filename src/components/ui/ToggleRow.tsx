import { ToggleTrack } from './Toggle';

interface ToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="focus-ring flex min-h-hit w-full cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-3 text-left transition-colors hover:bg-surface-fill"
        >
            <span>
                <span className="block text-row-title text-ink">{label}</span>
                {description && (
                    <span className="mt-0.5 block text-footnote text-ink-muted">{description}</span>
                )}
            </span>
            <ToggleTrack checked={checked} />
        </button>
    );
}
