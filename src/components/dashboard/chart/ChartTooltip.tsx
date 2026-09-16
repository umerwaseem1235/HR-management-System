import type { AttendanceChartModel } from './useAttendanceChartData';
import type { TrendPoint } from '../dashboard-types';

interface ChartTooltipProps {
  model: AttendanceChartModel;
  data: TrendPoint[];
}

export default function ChartTooltip({ model, data }: ChartTooltipProps) {
  const { hover, hp, tooltipTx, dims } = model;
  const { W, H } = dims;

  if (hover === null || !hp) return null;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg bg-[#17324D] px-3 py-1.5 shadow-lg"
      style={{
        left: `${(hp.x / W) * 100}%`,
        top: `${(hp.y / H) * 100}%`,
        transform: `translate(${tooltipTx}, calc(-100% - 12px))`,
      }}
    >
      <p className="text-[11px] font-medium text-white/80 whitespace-nowrap">{data[hover].fullLabel}</p>
      <p className="text-[13px] font-bold text-white whitespace-nowrap">{data[hover].value} present</p>
    </div>
  );
}
