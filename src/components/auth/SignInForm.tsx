import { useState, type SubmitEventHandler } from "react";
import { useNavigate } from "react-router";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Field } from "../Field";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Notice } from "../ui/Notice";

export default function SignInForm() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      if (code === 'auth/invalid-credential') {
        setError('Wrong email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else if (code === 'auth/network-request-failed') {
        setError("Couldn't reach WeakChat. Check your connection and try again.");
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />

      <Field
        id="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        rightSlot={
          <IconButton
            icon={showPassword ? "eye-off" : "eye"}
            label="Show password"
            aria-pressed={showPassword}
            size="sm"
            className="absolute right-1"
            onClick={() => setShowPassword((s) => !s)}
          />
        }
      />

      {error && <Notice tone="danger">{error}</Notice>}

      {/* Never held for being offline: the attempt reports what it could not reach. */}
      <Button type="submit" block isLoading={isLoading} className="mt-2">
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
