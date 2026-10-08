import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from "react";
import { cn } from "@/lib/helpers";

export function Field({
    id,
    label,
    labelRight,
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
    type?: HTMLInputTypeAttribute,
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    placeholder?: string
    autoComplete?: string,
    rightSlot?: ReactNode
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor={id} className="text-footnote font-medium text-ink">
                    {label}
                </label>
                {labelRight}
            </div>
            <div className="focus-ring-within relative flex min-h-hit items-center rounded-md bg-surface-fill">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={cn(
                        "w-full rounded-md bg-transparent py-2.75 pl-4 text-body text-ink outline-none placeholder:text-ink-muted",
                        rightSlot ? "pr-11" : "pr-4",
                    )}
                />
                {rightSlot}
            </div>
        </div>
    );
}
