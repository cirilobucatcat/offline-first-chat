import { useState, type SubmitEventHandler } from 'react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { ensureUserProfile } from '@/lib/users';
import { auth } from '@/lib/firebase';
import { Field } from '../Field';
import { StrengthMeter } from '../StrengthMeter';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Notice } from '../ui/Notice';

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  // Set by a submit, so an empty confirm field is reported too.
  const [mismatchReported, setMismatchReported] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const passwordsMismatch = password !== confirmPassword;
  const showMismatch = passwordsMismatch && (mismatchReported || confirmPassword.length > 0);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordsMismatch) {
      setMismatchReported(true);
      return;
    }

    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(user, { displayName: name });
      await ensureUserProfile(user.uid, name, email);
      // Identity key setup happens in IdentityKeyGate once /chat mounts —
      // useIdentityKeys() calls getOrCreateIdentityKeyPair itself right
      // after navigate() below. Calling it here too used to fire a second,
      // unawaited copy of the exact same guarded function concurrently
      // with that one, racing it for no benefit (the result here was never
      // even used). Removed rather than awaited, since awaiting it here
      // would just duplicate work IdentityKeyGate already does.

      navigate('/chat');
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      if (code === 'auth/email-already-in-use') {
        setError('That email is already registered.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
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
    <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
      <Field
        id='name'
        label='Full name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Ana Dela Cruz'
        autoComplete='name'
      />

      <Field
        id='email'
        label='Email address'
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='you@example.com'
        autoComplete='email'
      />

      <div>
        <Field
          id='password'
          label='Password'
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
          autoComplete='new-password'
          rightSlot={
            <IconButton
              icon={showPassword ? 'eye-off' : 'eye'}
              label='Show password'
              aria-pressed={showPassword}
              size='sm'
              className='absolute right-1'
              onClick={() => setShowPassword((s) => !s)}
            />
          }
        />
        <StrengthMeter password={password} />
      </div>

      <Field
        id='confirmPassword'
        label='Confirm password'
        type={showConfirm ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder='••••••••'
        autoComplete='new-password'
        error={showMismatch && "Passwords don't match."}
        rightSlot={
          <IconButton
            icon={showConfirm ? 'eye-off' : 'eye'}
            label='Show password confirmation'
            aria-pressed={showConfirm}
            size='sm'
            className='absolute right-1'
            onClick={() => setShowConfirm((s) => !s)}
          />
        }
      />

      {error && <Notice tone='danger'>{error}</Notice>}

      {/* Never held for being offline: the attempt reports what it could not reach. */}
      <Button type='submit' block isLoading={isLoading} className='mt-2'>
        {isLoading ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
