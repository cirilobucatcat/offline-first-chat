import { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/users';
import { auth } from '@/lib/firebase';
import { Avatar } from '../Avatar';
import { Popover, PopoverDivider, PopoverItem } from '../ui/Popover';
import { forgetIdentityKeyPair } from '@/lib/crypto/keyManager';

export function ProfileBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const name = user.displayName ?? 'You';
  const initials = getInitials(name);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await forgetIdentityKeyPair(user?.uid ?? '');
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
      setSigningOut(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-hairline dark:border-hairline-dark bg-white dark:bg-surface shrink-0">
      <Avatar initials={initials} uid={user.uid} size={38} />
      <span className="flex-1 min-w-0 truncate font-medium text-ink dark:text-pale-blue">
        {name}
      </span>

      <Popover icon={<Settings size={19} aria-hidden="true" />} label="Settings" placement="top">
        <PopoverItem
          icon={<Settings size={17} aria-hidden="true" className="text-muted dark:text-mist" />}
          onClick={() => navigate('/settings')}
        >
          Settings
        </PopoverItem>
        <PopoverDivider />
        <PopoverItem icon={<LogOut size={17} aria-hidden="true" />} onClick={handleLogout} disabled={signingOut} tone="danger">
          {signingOut ? 'Logging out…' : 'Log out'}
        </PopoverItem>
      </Popover>
    </div>
  );
}