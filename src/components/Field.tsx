import { useId, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/helpers";
import { Icon } from "@/components/ui/Icon";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange" | "className"> {
    id: undefined | string,
    label?: string,
    labelRight?: false | ReactNode,
    value: string
    /** Leave out only with `readOnly`. */
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void,
    /** Helper text under the field. */
    description?: string,
    /** What is wrong with the value. Marks the field invalid and is read with it. */
    error?: string | false | null,
    rightSlot?: ReactNode,
    inputClassName?: string,
}

export function Field({
    id,
    label,
    labelRight,
    type = "text",
    value,
    onChange,
    description,
    error,
    rightSlot,
    inputClassName,
    ...inputProps
}: FieldProps) {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    const describedBy = [error && errorId, description && descriptionId].filter(Boolean).join(" ") || undefined;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor={inputId} className="text-footnote font-medium text-ink">
                    {label}
                </label>
                {labelRight}
            </div>
            <div className="focus-ring-within relative flex min-h-hit items-center overflow-hidden rounded-md bg-surface-fill">
                <input
                    {...inputProps}
                    id={inputId}
                    type={type}
                    value={value}
                    onChange={onChange}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        "w-full rounded-none bg-transparent py-2.75 pl-4 text-body text-ink outline-none placeholder:text-ink-muted read-only:text-ink-muted",
                        rightSlot ? "pr-11" : "pr-4",
                        inputClassName,
                    )}
                />
                {rightSlot}
            </div>
            {error && (
                <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-footnote text-danger">
                    <Icon name="alert" size={16} className="mt-px" />
                    {error}
                </p>
            )}
            {description && (
                <p id={descriptionId} className="mt-1.5 text-footnote text-ink-muted">
                    {description}
                </p>
            )}
        </div>
    );
}
