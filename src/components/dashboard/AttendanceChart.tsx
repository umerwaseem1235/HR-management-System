'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

export interface TrendPoint {
  label: string;
  fullLabel: string;
  value: number;
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

// Catmull-Rom → cubic Bézier for a smooth curve through all points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export default function AttendanceChart({ data }: { data: TrendPoint[] }) {
  const W = 640;
  const H = 260;
  const padL = 34;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const bottom = padT + innerH;

  const gid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // Entrance animation: line draws itself, area + axes fade in on mount.
  // Disabled entirely when the user prefers reduced motion.
  const [drawn, setDrawn] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const noAnim = (style: React.CSSProperties): React.CSSProperties =>
    reducedMotion ? { ...style, transition: 'none' } : style;

  const maxV = Math.max(...data.map((d) => d.value), 1);
  const tickMax = niceCeil(maxV);
  const ticks = [0, 1, 2, 3, 4].map((i) => (tickMax * i) / 4);

  const x = (i: number) =>
    data.length === 1 ? padL + innerW / 2 : padL + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / tickMax) * innerH;

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const line = smoothPath(pts);
  const area =
    pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x.toFixed(2)},${bottom} L ${pts[0].x.toFixed(2)},${bottom} Z`
      : '';

  // Show at most ~8 x labels so month view stays readable
  const step = Math.max(1, Math.ceil(data.length / 8));

  const onMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || pts.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p.x - px);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? pts[hover] : null;
  const flipSide = hp ? hp.x / W : 0;
  const tx = flipSide < 0.18 ? '-12%' : flipSide > 0.82 ? '-88%' : '-50%';

  return (
    <div className="relative w-full select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block w-full">
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#024fa7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#024fa7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y gridlines + labels */}
        <g
          style={noAnim({
            opacity: drawn ? 1 : 0,
            transition: 'opacity 600ms ease-in-out 150ms',
          })}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#D6E4E8" strokeOpacity="0.55" strokeWidth="1" />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9AA5B1">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
        </g>

        {/* Area fill */}
        {area && (
          <path
            d={area}
            fill={`url(#${gid}-fill)`}
            style={noAnim({
              opacity: drawn ? 1 : 0,
              transition: 'opacity 900ms ease-in-out 350ms',
            })}
          />
        )}

        {/* Smooth line — draws itself via normalized dash offset */}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="#024fa7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={noAnim({
              strokeDasharray: 1,
              strokeDashoffset: drawn ? 0 : 1,
              transition: 'stroke-dashoffset 1200ms ease-in-out',
            })}
          />
        )}

        {/* X labels */}
        <g
          style={noAnim({
            opacity: drawn ? 1 : 0,
            transition: 'opacity 600ms ease-in-out 450ms',
          })}
        >
          {data.map((d, i) =>
            i % step === 0 || i === data.length - 1 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6B7280">
                {d.label}
              </text>
            ) : null
          )}
        </g>

        {/* Hover dot with halo */}
        {hp && (
          <g pointerEvents="none">
            <circle cx={hp.x} cy={hp.y} r="9" fill="#024fa7" opacity="0.18" />
            <circle cx={hp.x} cy={hp.y} r="4.5" fill="#024fa7" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Dark tooltip pill */}
      {hover !== null && hp && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-[#17324D] px-3 py-1.5 shadow-lg"
          style={{
            left: `${(hp.x / W) * 100}%`,
            top: `${(hp.y / H) * 100}%`,
            transform: `translate(${tx}, calc(-100% - 12px))`,
          }}
        >
          <p className="text-[11px] font-medium text-white/80 whitespace-nowrap">{data[hover].fullLabel}</p>
          <p className="text-[13px] font-bold text-white whitespace-nowrap">{data[hover].value} present</p>
        </div>
      )}
    </div>
  );
}
