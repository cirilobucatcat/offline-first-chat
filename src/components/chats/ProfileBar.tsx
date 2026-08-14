import { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/users';
import { auth } from '@/lib/firebase';
import { COLOR } from '@/lib/constants';
import { Avatar } from '../Avatar';
import { Popover, PopoverDivider, PopoverItem } from '../ui/Popover';

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
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
      setSigningOut(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
      style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
    >
      <Avatar initials={initials} uid={user.uid} size={38} />
      <span className="flex-1 min-w-0 truncate font-medium" style={{ color: COLOR.ink }}>
        {name}
      </span>

      <Popover icon={<Settings size={19} aria-hidden="true" />} label="Settings" placement="top">
        <PopoverItem
          icon={<Settings size={17} aria-hidden="true" style={{ color: 'rgba(15, 48, 64, 0.72)' }} />}
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