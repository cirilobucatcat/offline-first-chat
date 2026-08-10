import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Field } from "../Field";
import { PALE_BLUE, PRIMARY } from "../../lib/constants";
import { Checkbox } from "../Checkbox";
import { useState } from "react";

export default function SignInForm() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    
  }
 
  return (
    <>
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
      </div>

      <Checkbox id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)}>
        Remember me on this device
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
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </>
  )
}
