import { INK, PRIMARY } from "../lib/constants";
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
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i < score ? PRIMARY : "rgba(15,48,64,0.1)" }}
                    />
                ))}
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "rgba(15,48,64,0.6)" }}>
                Password strength: <span style={{ fontWeight: 600, color: INK }}>{label}</span>
            </p>
        </div>
    );
}
