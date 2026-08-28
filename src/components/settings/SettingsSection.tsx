import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    tone?: 'default' | 'danger';
    children: ReactNode;
}

export function SettingsSection({
    icon: Icon,
    title,
    description,
    tone = 'default',
    children,
}: SettingsSectionProps) {
    const isDanger = tone === 'danger';

    return (
        <section
            className={`overflow-hidden rounded-2xl border bg-white dark:bg-surface shadow-sm ${isDanger ? 'border-danger-border dark:border-danger-dark/40' : 'border-border dark:border-hairline-dark'
                }`}
        >
            <div
                className={`flex items-start gap-3 border-b p-5 sm:p-6 ${isDanger ? 'border-danger-border/60 dark:border-danger-dark/20' : 'border-hairline dark:border-hairline-dark'
                    }`}
            >
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDanger ? 'bg-danger-bg dark:bg-danger-dark/15' : 'bg-primary-light dark:bg-accent/10'
                        }`}
                >
                    <Icon className={`h-5 w-5 ${isDanger ? 'text-danger dark:text-danger-dark' : 'text-primary dark:text-accent'}`} />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-ink dark:text-pale-blue">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-sm text-ink-muted dark:text-mist">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}