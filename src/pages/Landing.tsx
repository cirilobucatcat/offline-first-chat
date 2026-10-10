import { Navigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Landing() {
  const { user, loading } = useAuth();

  // Wait for the session before drawing anything, so someone signed in never sees this page flash by.
  if (loading) {
    return <LoadingScreen>Loading…</LoadingScreen>;
  }

  // The installed app opens at "/", so someone signed in goes straight to their chats.
  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
