import { AuthSwitch } from '@/components/auth/AuthLayout';
import SignInForm from '@/components/auth/SignInForm';

export default function SignIn() {
  return (
    <>
      <h1 className="text-display text-ink">Welcome back</h1>
      <SignInForm />
      <AuthSwitch prompt="New to WeakChat?" to="/signup">
        Create an account
      </AuthSwitch>
    </>
  );
}
