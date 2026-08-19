import { useState, type SubmitEventHandler } from 'react'
import { Field } from '../Field'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { Checkbox } from '../Checkbox'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useNavigate } from 'react-router'
import { ensureUserProfile } from '@/lib/users'
import { getOrCreateIdentityKeyPair } from '@/lib/crypto/keyManager'
import { auth } from '@/lib/firebase'
import { COLOR } from '@/lib/constants'
import { StrengthMeter } from '../StrengthMeter'

export default function SignUpForm() {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await ensureUserProfile(user.uid, name, email);
      getOrCreateIdentityKeyPair(user.uid)

      navigate('/chat');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('That email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (<form className='flex flex-col gap-y-4' onSubmit={handleSubmit}>
    {error && (
      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    )}
    <Field
      id="name"
      label="Full name"
      icon={User}
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Ana Dela Cruz"
      autoComplete="name"
    />

    <Field
      id="email"
      label="Email address"
      icon={Mail}
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@example.com"
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
      <StrengthMeter password={password} />
    </div>

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

    <Checkbox id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)}>
      I agree to the{" "}
      <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: COLOR.primary }}>
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: COLOR.primary }}>
        Privacy Policy
      </a>
    </Checkbox>

    <button
      type="submit"
      disabled={isLoading || !agree}
      aria-busy={isLoading}
      className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-7"
      style={{
        backgroundColor: COLOR.primary,
        color: COLOR.paleBlue,
        opacity: isLoading || !agree ? 0.75 : 1,
        cursor: isLoading || !agree ? "not-allowed" : "pointer",
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Creating account…
        </>
      ) : (
        <>
          Sign Up
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  </form>)
}
