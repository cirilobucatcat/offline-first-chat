import { useState } from 'react'
import { Field } from '../Field'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { PALE_BLUE, PRIMARY } from '../../lib/constants'
import { StrengthMeter } from '../StrengthMeter'
import { Checkbox } from '../Checkbox'

export default function SignUpForm() {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agree, setAgree] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)

  }

  return (<>
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
            style={{ color: PRIMARY }}
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
      <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: PRIMARY }}>
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" onClick={(e) => e.preventDefault()} className="font-medium underline" style={{ color: PRIMARY }}>
        Privacy Policy
      </a>
    </Checkbox>

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
          Creating account…
        </>
      ) : (
        <>
          Sign Up
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  </>
  )
}
