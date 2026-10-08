import { AuthSwitch } from '@/components/auth/AuthLayout';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUp() {
  return (
    <>
      <h1 className="text-display text-ink">Create your account</h1>
      <SignUpForm />
      <AuthSwitch prompt="Already have an account?" to="/login">
        Sign in
      </AuthSwitch>
    </>
  );
}
