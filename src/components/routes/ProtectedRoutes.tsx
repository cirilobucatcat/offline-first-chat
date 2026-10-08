import { Navigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { IdentityKeyGate } from '../crypto/IdentityKeyGate';
import { LoadingScreen } from '../ui/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen>Loading…</LoadingScreen>;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return <IdentityKeyGate>{children}</IdentityKeyGate>;
}
