import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { logOut } from '@/lib/account';
import { Avatar } from '../Avatar';
import { Popover, PopoverDivider, PopoverItem } from '../ui/Popover';

export function ProfileBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const name = user.displayName ?? 'You';

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
      setSigningOut(false);
    }
  }

  return (
    <div className="flex h-15 shrink-0 items-center gap-3 border-t border-line bg-surface pr-1 pl-4">
      <Avatar name={name} id={user.uid} />
      <span className="min-w-0 flex-1 truncate text-row-title text-ink">{name}</span>

      <Popover icon="settings" label="Settings" placement="top">
        <PopoverItem icon="settings" onClick={() => navigate('/settings')}>
          Settings
        </PopoverItem>
        <PopoverDivider />
        <PopoverItem icon="log-out" onClick={handleLogout} disabled={signingOut} tone="danger">
          {signingOut ? 'Logging out…' : 'Log out'}
        </PopoverItem>
      </Popover>
    </div>
  );
}
