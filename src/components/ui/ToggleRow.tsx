import { useId } from 'react';
import { ToggleTrack } from './Toggle';

interface ToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/** A settings row that is itself the switch. The negative margin lines its text up with the card's. */
export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
    const id = useId();

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={`${id}-label`}
            aria-describedby={description ? `${id}-description` : undefined}
            onClick={() => onChange(!checked)}
            className="focus-ring -mx-3 flex min-h-hit cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-fill"
        >
            <span className="min-w-0">
                <span id={`${id}-label`} className="block text-row-title text-ink">{label}</span>
                {description && (
                    <span id={`${id}-description`} className="mt-0.5 block text-footnote text-ink-muted">{description}</span>
                )}
            </span>
            <ToggleTrack checked={checked} />
        </button>
    );
}
