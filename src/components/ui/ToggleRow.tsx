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
            className="wc-focus flex w-full items-center justify-between gap-3 rounded-xl border border-hairline dark:border-hairline-dark px-4 py-3 text-left"
        >
            <span>
                <span className="block text-sm font-medium text-ink dark:text-pale-blue">{label}</span>
                {description && (
                    <span className="mt-0.5 block text-xs text-muted dark:text-mist">{description}</span>
                )}
            </span>
            <span
                aria-hidden="true"
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary dark:bg-accent' : 'bg-border dark:bg-mist/25'
                    }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                />
            </span>
        </button>
    );
}