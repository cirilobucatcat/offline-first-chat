import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 py-12 text-center">
      <h1 className="text-display text-ink">Page not found</h1>
      <p className="max-w-sm text-subhead text-ink-muted">There's nothing at this address.</p>
      <Button onClick={() => navigate('/chat')}>Go to chats</Button>
    </main>
  )
}
