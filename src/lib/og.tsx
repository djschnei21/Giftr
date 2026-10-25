export const ogSize = { width: 1200, height: 630 };

export const ogColors = {
  paper: "#faf6ef",
  ink: "#1f1a17",
  muted: "#6e645b",
  berry: "#b01e2b",
  gold: "#c99a3b",
  cream: "#fffaf5",
};

export function OgGift({ size, box = ogColors.berry, ribbon = ogColors.gold }: { size: number; box?: string; ribbon?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="5" y="13" width="22" height="15" rx="3" fill={box} />
      <rect x="3" y="9" width="26" height="6" rx="2" fill={box} />
      <rect x="14.5" y="9" width="3" height="19" fill={ribbon} />
      <path
        d="M16 9c-1.5-3.6-6.2-5-7.4-2.6-1 2 1.8 3.4 7.4 2.6Zm0 0c1.5-3.6 6.2-5 7.4-2.6 1 2-1.8 3.4-7.4 2.6Z"
        fill={ribbon}
      />
    </svg>
  );
}

const flakes = [
  [64, 80, 10],
  [180, 520, 6],
  [320, 140, 8],
  [460, 560, 12],
  [610, 90, 6],
  [760, 500, 9],
  [900, 160, 7],
  [1040, 540, 11],
  [1120, 70, 8],
  [1000, 300, 5],
  [140, 320, 5],
] as const;

export function OgSnow({ color = "rgba(255,255,255,0.35)" }: { color?: string }) {
  return (
    <>
      {flakes.map(([x, y, s]) => (
        <div
          key={`${x}-${y}`}
          style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: 999, background: color }}
        />
      ))}
    </>
  );
}
