import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { TrendPoint } from '../dashboard-types';

export const CHART_W = 640;
export const CHART_H = 260;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;

export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

// Catmull-Rom → cubic Bézier for a smooth curve through all points
export function smoothPath(pts: { x: number; y: number }[]): string {
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

/**
 * All data transformation, scaling, hover tracking, and entrance-animation
 * state for the attendance trend chart. No JSX lives here.
 */
export function useAttendanceChartData(data: TrendPoint[]) {
  const innerW = CHART_W - PAD_L - PAD_R;
  const innerH = CHART_H - PAD_T - PAD_B;
  const bottom = PAD_T + innerH;

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
  const noAnim = (style: CSSProperties): CSSProperties =>
    reducedMotion ? { ...style, transition: 'none' } : style;

  const maxV = Math.max(...data.map((d) => d.value), 1);
  const tickMax = niceCeil(maxV);
  const ticks = [0, 1, 2, 3, 4].map((i) => (tickMax * i) / 4);

  const x = (i: number) =>
    data.length === 1 ? PAD_L + innerW / 2 : PAD_L + (i / (data.length - 1)) * innerW;
  const y = (v: number) => PAD_T + innerH - (v / tickMax) * innerH;

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const line = smoothPath(pts);
  const area =
    pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x.toFixed(2)},${bottom} L ${pts[0].x.toFixed(2)},${bottom} Z`
      : '';

  // Show at most ~8 x labels so month view stays readable
  const step = Math.max(1, Math.ceil(data.length / 8));

  const handleMove = (e: MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || pts.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
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

  const handleLeave = () => setHover(null);

  const hp = hover !== null ? pts[hover] : null;
  const flipSide = hp ? hp.x / CHART_W : 0;
  const tooltipTx = flipSide < 0.18 ? '-12%' : flipSide > 0.82 ? '-88%' : '-50%';

  return {
    gid,
    svgRef,
    hover,
    drawn,
    ticks,
    x,
    y,
    pts,
    line,
    area,
    step,
    hp,
    tooltipTx,
    handleMove,
    handleLeave,
    noAnim,
    dims: { W: CHART_W, H: CHART_H, padL: PAD_L, padR: PAD_R, padT: PAD_T, padB: PAD_B },
  };
}

export type AttendanceChartModel = ReturnType<typeof useAttendanceChartData>;
