import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The design-system names from @theme in index.css. Without them twMerge reads
// `text-title` as a colour and drops it when it meets `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'title', 'headline', 'row-title', 'body', 'subhead', 'footnote', 'caption', 'safety'],
      radius: ['bubble', 'sheet'],
      shadow: ['bubble', 'raised', 'float'],
      spacing: ['hit', 'row', 'bubble-max'],
      animate: ['bubble-in', 'sheet-up', 'clock-hand', 'typing-dot'],
    },
  },
});

export function getStrength(pw: string) {
    if (!pw) return { score: 0, label: "" };
    if (pw.length < 6) return { score: 1, label: "Too short" };
    let score = 1;
    if (pw.length >= 10) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    const labels: Record<number, string> = { 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong" };
    return { score, label: labels[score] };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
 