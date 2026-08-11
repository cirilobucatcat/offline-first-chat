import { AVATAR_TINTS, COLOR } from "@/lib/constants";

export function Avatar({ initials, index, size = 44 }: { initials: string, index: number, size?: number}) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_TINTS[index % AVATAR_TINTS.length],
        color: COLOR.white,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}