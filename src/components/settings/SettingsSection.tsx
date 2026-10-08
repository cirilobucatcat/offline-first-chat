import type { ReactNode } from 'react';
import { cn } from '@/lib/helpers';
import { Icon } from '@/components/ui/Icon';

interface SettingsSectionProps {
    /** Id of the heading; it names the section for screen readers. */
    id: string;
    title: string;
    description?: string;
    /** `danger` is for a section whose action cannot be undone. Used once, for deleting the account. */
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
    const danger = tone === 'danger';

    return (
        <section
            aria-labelledby={id}
            className={cn(
                'rounded-md border p-4 md:p-5',
                // danger-soft is the ground for a destructive action. The border and the alert glyph
                // carry the warning too, so it never rests on the tint alone.
                danger ? 'border-danger bg-danger-soft [--focus-gap:var(--color-danger-soft)]' : 'border-line bg-surface',
            )}
        >
            <div className="mb-4">
                <h2 id={id} className={cn('flex items-center gap-2 text-headline', danger ? 'text-danger' : 'text-ink')}>
                    {danger && <Icon name="alert" size={20} />}
                    {title}
                </h2>
                {description && (
                    // ink-muted is not checked on danger-soft, so the description uses ink there.
                    <p className={cn('mt-0.5 text-footnote', danger ? 'text-ink' : 'text-ink-muted')}>
                        {description}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-4">{children}</div>
        </section>
    );
}
