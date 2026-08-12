import { colorIndexForId } from "@/lib/chat";
import { AVATAR_TINTS, COLOR } from "@/lib/constants";

export function Avatar({ initials, uid, size = 44 }: { initials: string, uid: string, size?: number}) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_TINTS[colorIndexForId(uid,  AVATAR_TINTS.length)],
        color: COLOR.white,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}