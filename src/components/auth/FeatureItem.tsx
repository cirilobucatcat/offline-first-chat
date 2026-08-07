import { type LucideIcon } from 'lucide-react'


export function FeatureItem({ icon: Icon, text }: { icon: LucideIcon, text: string }) {
    return (
        <li className="flex items-center gap-3">
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
                <Icon className="w-4 h-4 text-pale-blue" aria-hidden="true" />
            </div>
            <span className="text-sm" style={{ color: "rgba(227,242,253,0.9)" }}>
                {text}
            </span>
        </li>
    );
}
