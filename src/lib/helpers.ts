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