import { getStrength } from "../lib/helpers";

export function StrengthMeter({ password }: { password: string }) {
    if (!password) return null;
    const { score, label } = getStrength(password);
    return (
        <div className="mt-2" aria-live="polite">
            <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? 'bg-primary dark:bg-accent' : 'bg-ink/10 dark:bg-mist/20'
                            }`}
                    />
                ))}
            </div>
            <p className="mt-1.5 text-xs text-muted dark:text-mist">
                Password strength: <span className="font-semibold text-ink dark:text-pale-blue">{label}</span>
            </p>
        </div>
    );
}