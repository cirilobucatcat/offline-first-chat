import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Field } from "../Field";
import { Checkbox } from "../Checkbox";
import { useState, type SubmitEventHandler } from "react";
import { useNavigate } from "react-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { COLOR } from "@/lib/constants";
import { getOrCreateIdentityKeyPair } from "@/lib/crypto/keyManager";

export default function SignInForm() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/chat');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Wrong email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
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
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              style={{ color: COLOR.primary }}
            >
              Forgot password?
            </button>
          }
          icon={Lock}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
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
      </div>

      <Checkbox id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)}>
        Remember me on this device
      </Checkbox>

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-7"
        style={{
          backgroundColor: COLOR.primary,
          color: COLOR.paleBlue,
          opacity: isLoading ? 0.75 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>)
}
