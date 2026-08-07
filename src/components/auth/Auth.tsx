import { ArrowRight, Eye, EyeOff, Loader, Loader2, Lock, Mail, MessageCircle, ShieldCheck, User, WifiOff, Zap } from "lucide-react";
import { INK, PALE_BLUE, PRIMARY } from "../../lib/constants";
import { FeatureItem } from "./FeatureItem";
import { useEffect, useState } from "react";
import { Field } from "../Field";
import { StrengthMeter } from "../StrengthMeter";
import { Checkbox } from "../Checkbox";

export default function Auth() {

    const [mode, setMode] = useState<'signin' | 'signup'>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode') === 'signup' ? 'signup' : 'signin';
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [agree, setAgree] = useState(false);
    const isSignIn = mode === "signin";

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1800);
    };

    const handleModeSwitch = (newMode: 'signin' | 'signup') => {
        setMode(newMode);
        const url = new URL(window.location.href);
        url.searchParams.set('mode', newMode);
        window.history.pushState({}, '', url.toString());
    };

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setMode(params.get('mode') === 'signup' ? 'signup' : 'signin');
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10"
            style={{
                backgroundColor: PALE_BLUE,
                backgroundImage:
                    "radial-gradient(circle at 50% 38%, rgba(13,71,161,0.08), transparent 60%), radial-gradient(rgba(13,71,161,0.18) 1px, transparent 1.5px)",
                backgroundSize: "auto, 24px 24px",
                fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <style>{`
      `}</style>

            <div
                className="auth-card w-full max-w-md lg:max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: "#FFFFFF" }}
            >
                {/* Brand panel */}
                <div
                    className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
                    style={{ background: `linear-gradient(160deg, ${PRIMARY} 0%, #082C63 100%)` }}
                >
                    <div
                        className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                        aria-hidden="true"
                    />
                    <div
                        className="absolute top-1/2 -left-16 w-56 h-56 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        aria-hidden="true"
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-14">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                            >
                                <MessageCircle className="w-5 h-5" style={{ color: PALE_BLUE }} />
                            </div>
                            <span className="text-xl font-bold tracking-tight" style={{ color: PALE_BLUE }}>
                                WeakChat
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold leading-snug mb-4" style={{ color: PALE_BLUE }}>
                            Chat that never
                            <br />
                            waits on a connection.
                        </h2>
                        <p className="text-base leading-relaxed max-w-sm" style={{ color: "rgba(227,242,253,0.8)" }}>
                            Every message is stored on your device first and encrypted end-to-end — online or off.
                        </p>

                        <ul className="mt-10 space-y-4">
                            <FeatureItem icon={WifiOff} text="Works fully offline, syncs when you're back" />
                            <FeatureItem icon={ShieldCheck} text="End-to-end encrypted, always" />
                            <FeatureItem icon={Zap} text="Lightweight — built for speed" />
                        </ul>
                    </div>

                    <div className="relative z-10 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="relative flex w-2 h-2">
                                <span
                                    className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-75"
                                    style={{ backgroundColor: PALE_BLUE }}
                                />
                                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ backgroundColor: PALE_BLUE }} />
                            </span>
                            <span className="text-xs font-medium" style={{ color: "rgba(227,242,253,0.85)" }}>
                                Synced just now
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: PALE_BLUE }}>
                            Sent this on the subway, no signal — it went through the moment I got back online.
                        </p>
                    </div>
                </div>

                {/* Form panel */}
                <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: PRIMARY }}
                        >
                            <MessageCircle className="w-4 h-4" style={{ color: PALE_BLUE }} />
                        </div>
                        <span className="text-lg font-bold" style={{ color: INK }}>
                            WeakChat
                        </span>
                    </div>

                    <div
                        role="tablist"
                        aria-label="Authentication mode"
                        className="grid grid-cols-2 gap-1 p-1 rounded-full mb-8"
                        style={{ backgroundColor: "rgba(13,71,161,0.07)" }}
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isSignIn}
                            onClick={() => handleModeSwitch('signin')}
                            className="py-2.5 text-sm font-semibold rounded-full transition-all duration-200"
                            style={
                                isSignIn
                                    ? { backgroundColor: PRIMARY, color: PALE_BLUE, boxShadow: "0 2px 8px rgba(13,71,161,0.35)" }
                                    : { color: "rgba(15,48,64,0.6)" }
                            }
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isSignIn}
                            onClick={() => handleModeSwitch('signup')}
                            className="py-2.5 text-sm font-semibold rounded-full transition-all duration-200"
                            style={
                                !isSignIn
                                    ? { backgroundColor: PRIMARY, color: PALE_BLUE, boxShadow: "0 2px 8px rgba(13,71,161,0.35)" }
                                    : { color: "rgba(15,48,64,0.6)" }
                            }
                        >
                            Sign Up
                        </button>
                    </div>

                    <span
                        className="text-xs font-semibold uppercase mb-2"
                        style={{ color: PRIMARY, letterSpacing: "0.1em" }}
                    >
                        {isSignIn ? "Sign in" : "Get started"}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ color: INK }}>
                        {isSignIn ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="text-sm mb-8" style={{ color: "rgba(15,48,64,0.6)" }}>
                        {isSignIn
                            ? "Pick up your conversations right where you left them."
                            : "Set up WeakChat in under a minute — no phone number required."}
                    </p>

                    <div key={mode} className="field-fade space-y-5">
                        {!isSignIn && (
                            <Field
                                id="name"
                                label="Full name"
                                icon={User}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ana Dela Cruz"
                                autoComplete="name"
                            />
                        )}

                        <Field
                            id="email"
                            label="Email address"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />

                        <div>
                            <Field
                                id="password"
                                label="Password"
                                labelRight={
                                    isSignIn && (
                                        <button
                                            type="button"
                                            className="text-sm font-medium hover:underline"
                                            style={{ color: PRIMARY }}
                                        >
                                            Forgot password?
                                        </button>
                                    )
                                }
                                icon={Lock}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={isSignIn ? "current-password" : "new-password"}
                                rightSlot={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3.5 rounded-md p-1"
                                        style={{ color: "rgba(15,48,64,0.5)" }}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                            {!isSignIn && <StrengthMeter password={password} />}
                        </div>

                        {!isSignIn && (
                            <Field
                                id="confirmPassword"
                                label="Confirm password"
                                icon={Lock}
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                rightSlot={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                        className="absolute right-3.5 rounded-md p-1"
                                        style={{ color: "rgba(15,48,64,0.5)" }}
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        )}

                        {isSignIn ? (
                            <Checkbox id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)}>
                                Remember me on this device
                            </Checkbox>
                        ) : (
                            <Checkbox id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)}>
                                I agree to the{" "}
                                <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: PRIMARY }}>
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: PRIMARY }}>
                                    Privacy Policy
                                </a>
                            </Checkbox>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        aria-busy={isLoading}
                        className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-7"
                        style={{
                            backgroundColor: PRIMARY,
                            color: PALE_BLUE,
                            opacity: isLoading ? 0.75 : 1,
                            cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                {isSignIn ? "Signing in…" : "Creating account…"}
                            </>
                        ) : (
                            <>
                                {isSignIn ? "Sign In" : "Create Account"}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 mt-5 text-xs" style={{ color: "rgba(15,48,64,0.55)" }}>
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        End-to-end encrypted. Works fully offline.
                    </p>

                    <p className="text-center text-sm mt-8" style={{ color: "rgba(15,48,64,0.65)" }}>
                        {isSignIn ? "New to WeakChat? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setMode(isSignIn ? "signup" : "signin")}
                            className="font-semibold hover:underline disabled:bg-pale-blue"
                            style={{ color: PRIMARY }}
                        >
                            {isSignIn ? "Create an account" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}