import { colorIndexForId } from '@/lib/chat';
import { AVATAR_TINTS } from '@/lib/constants';
import { Users } from 'lucide-react';

const WHITE = '#FFFFFF';

interface AvatarProps {
  initials: string;
  uid: string;
  size?: number;
  isGroup?: boolean;
}

export function Avatar({ initials, uid, size = 44, isGroup = false }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_TINTS[colorIndexForId(uid, AVATAR_TINTS.length)],
        color: WHITE,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {isGroup ? <Users size={Math.round(size * 0.46)} aria-hidden="true" /> : initials}
    </div>
  );
}