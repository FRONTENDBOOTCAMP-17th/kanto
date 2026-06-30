

interface MeetupAvatarProps {
  name: string;
  size?: number;
}

const COLORS = [
  { bg: "#fee2e2", fg: "#dc2626" },
  { bg: "#dbeafe", fg: "#2563eb" },
  { bg: "#ede9fe", fg: "#7c3aed" },
  { bg: "#ffedd5", fg: "#ea580c" },
  { bg: "#dcfce7", fg: "#16a34a" },
  { bg: "#fce7f3", fg: "#db2777" },
];

export function MeetupAvatar({ name, size = 36 }: MeetupAvatarProps) {
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx + name.charCodeAt(i)) % COLORS.length;
  const { bg, fg } = COLORS[idx];
  return (
    <div
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.4) }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
    >
      {name.charAt(0)}
    </div>
  );
}
