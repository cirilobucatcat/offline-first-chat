import type { ChangeEvent } from "react";

export function Checkbox({ id, checked, onChange, children }: { id?: string, checked: boolean, onChange: (e: ChangeEvent<HTMLInputElement>) => void, children: React.ReactNode }) {
    return (
        <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 mt-0.5 rounded shrink-0 accent-primary dark:accent-accent"
            />
            <span className="text-sm leading-snug text-muted dark:text-mist">
                {children}
            </span>
        </label>
    );
}