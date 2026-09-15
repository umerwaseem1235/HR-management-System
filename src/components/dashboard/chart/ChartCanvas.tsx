import type { AttendanceChartModel } from './useAttendanceChartData';
import type { TrendPoint } from '../dashboard-types';

interface ChartCanvasProps {
  model: AttendanceChartModel;
  data: TrendPoint[];
}

export default function ChartCanvas({ model, data }: ChartCanvasProps) {
  const { gid, svgRef, dims, ticks, x, y, line, area, step, hp, drawn, noAnim } = model;
  const { W, H, padL, padR } = dims;

  return (
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
  );
}
