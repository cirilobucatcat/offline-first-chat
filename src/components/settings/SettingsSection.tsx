import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';

interface SettingsSectionProps {
    /** Id of the heading; it names the section for screen readers. */
    id: string;
    title: string;
    description?: string;
    tone?: 'default' | 'danger';
    children: ReactNode;
}

export function SettingsSection({
    id,
    title,
    description,
    tone = 'default',
    children,
}: SettingsSectionProps) {
    return (
        <section aria-labelledby={id} className="rounded-md border border-line bg-surface p-4 md:p-5">
            <div className="mb-4">
                <h2 id={id} className={cn('text-headline', tone === 'danger' ? 'text-danger' : 'text-ink')}>
                    {title}
                </h2>
                {description && (
                    <p className="mt-0.5 text-footnote text-ink-muted">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}
