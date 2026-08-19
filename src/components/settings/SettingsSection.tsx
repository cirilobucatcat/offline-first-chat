import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { COLOR } from '@/lib/constants';

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
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: isDanger ? COLOR.dangerBorder : COLOR.border }}
        >
            <div
                className="flex items-start gap-3 border-b p-5 sm:p-6"
                style={{ borderColor: isDanger ? '#FEE2E2' : '#EEF5FC' }}
            >
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDanger ? COLOR.dangerBg : COLOR.primaryLight }}
                >
                    <Icon className="h-5 w-5" style={{ color: isDanger ? COLOR.danger : COLOR.primary }} />
                </div>
                <div>
                    <h2 className="text-base font-semibold" style={{ color: COLOR.ink }}>
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-sm" style={{ color: COLOR.inkMuted }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}