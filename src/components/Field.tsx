import type { LucideIcon } from "lucide-react";
import { useState, type ChangeEvent, type HTMLInputTypeAttribute, type ReactNode } from "react";
import { INK, PRIMARY } from "../lib/constants";

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
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={id} className="text-sm font-medium" style={{ color: INK }}>
                    {label}
                </label>
                {labelRight}
            </div>
            <div
                className="relative flex items-center rounded-xl border-2 transition-all duration-200"
                style={{
                    borderColor: focused ? PRIMARY : "#D7E8F8",
                    backgroundColor: focused ? "#F7FBFF" : "#FFFFFF",
                    boxShadow: focused ? "0 0 0 4px rgba(13,71,161,0.12)" : "none",
                }}
            >
                <Icon
                    className="absolute left-3.5 w-4 h-4 pointer-events-none"
                    style={{ color: focused ? PRIMARY : "rgba(15,48,64,0.4)" }}
                    aria-hidden="true"
                />
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full bg-transparent py-3 pl-11 pr-11 text-sm outline-none"
                    style={{ color: INK }}
                />
                {rightSlot}
            </div>
        </div>
    );
}