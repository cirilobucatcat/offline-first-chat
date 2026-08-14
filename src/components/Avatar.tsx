import { colorIndexForId } from '@/lib/chat';
import { Users } from 'lucide-react';

const AVATAR_TINTS = ['#0D47A1', '#123E6B', '#0F3040', '#15508F'];
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
      className="flex items-center justify-center rounded-full font-semibold flex-shrink-0"
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