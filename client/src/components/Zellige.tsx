import { useId } from 'react';

export function starPoints(cx: number, cy: number, r1: number, r2: number, n = 8, rot = 0) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / n + rot;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function ZelligePattern({ a, b, c, size = 72, className = '' }: { a: string; b: string; c: string; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const s = size;
  const h = s / 2;
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={`z${id}`} width={s} height={s} patternUnits="userSpaceOnUse">
          <polygon points={starPoints(h, h, s * 0.42, s * 0.2)} fill={a} />
          <polygon points={starPoints(h, h, s * 0.17, s * 0.08, 8, Math.PI / 8)} fill={b} />
          {[0, s].flatMap((x) => [0, s].map((y) => <polygon key={`${x}-${y}`} points={starPoints(x, y, s * 0.16, s * 0.07)} fill={c} />))}
          <circle cx={h} cy={h} r={s * 0.04} fill={c} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#z${id})`} />
    </svg>
  );
}

export function Logo({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={onDark ? '#FFFFFF' : '#3F45C8'} />
        <polygon points={starPoints(16, 16, 12, 6)} fill="#E2A42C" />
        <circle cx="16" cy="16" r="3.4" fill={onDark ? '#FFFFFF' : '#3F45C8'} />
      </svg>
      <span className="font-display text-[26px] font-extrabold leading-none tracking-tight">souk</span>
    </span>
  );
}
