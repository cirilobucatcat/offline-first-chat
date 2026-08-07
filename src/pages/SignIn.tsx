import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router';
import Auth from '../components/auth/Auth';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
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
    // <div className="flex items-center justify-center min-h-screen bg-gray-50">
    //   <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
    //     <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        
    //     {error && (
    //       <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
    //         {error}
    //       </div>
    //     )}

    //     <form onSubmit={handleSignIn} className="space-y-4">
    //       <div>
    //         <label className="block text-sm font-medium mb-1">Email</label>
    //         <input
    //           type="email"
    //           value={email}
    //           onChange={(e) => setEmail(e.target.value)}
    //           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    //           required
    //         />
    //       </div>

    //       <div>
    //         <label className="block text-sm font-medium mb-1">Password</label>
    //         <input
    //           type="password"
    //           value={password}
    //           onChange={(e) => setPassword(e.target.value)}
    //           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    //           required
    //         />
    //       </div>

    //       <button
    //         type="submit"
    //         disabled={loading}
    //         className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
    //       >
    //         {loading ? 'Signing in...' : 'Sign In'}
    //       </button>
    //     </form>

    //     <p className="mt-4 text-center text-sm text-gray-600">
    //       Don't have an account?{' '}
    //       <a href="/signup" className="text-blue-500 hover:underline">
    //         Sign Up
    //       </a>
    //     </p>
    //   </div>
    // </div>
    <Auth />
  );
}