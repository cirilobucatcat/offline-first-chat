import type { LucideIcon } from "lucide-react";
import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from "react";

export function Field({
    id,
    label,
    labelRight,
    icon: Icon,
    type = "text",
    value,
    onChange,
    placeholder,
    autoComplete,
    rightSlot,
}: {
    id: undefined | string,
    label?: string,
    labelRight?: false | ReactNode,
    icon: LucideIcon,
    type?: HTMLInputTypeAttribute,
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    placeholder?: string
    autoComplete?: string,
    rightSlot?: ReactNode
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={id} className="text-sm text-ink dark:text-pale-blue font-medium">
                    {label}
                </label>
                {labelRight}
            </div>
            <div className="relative flex items-center rounded-xl border-2 transition-colors duration-200 border-pale-blue dark:border-hairline-dark bg-white dark:bg-ink focus-within:border-primary/50 dark:focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-primary/10 dark:focus-within:ring-accent/15 focus-within:bg-[#F7FBFF]">
                <Icon
                    className="absolute left-3.5 w-4 h-4 pointer-events-none text-muted dark:text-mist"
                    aria-hidden="true"
                />
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full py-3 pl-11 pr-11 text-sm rounded-lg bg-transparent text-ink dark:text-pale-blue placeholder:text-muted dark:placeholder:text-mist outline-none"
                />
                {rightSlot}
            </div>
        </div>
    );
}