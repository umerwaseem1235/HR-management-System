'use client';

import { useAttendanceChartData } from './chart/useAttendanceChartData';
import ChartCanvas from './chart/ChartCanvas';
import ChartTooltip from './chart/ChartTooltip';
import type { TrendPoint } from './dashboard-types';

export type { TrendPoint } from './dashboard-types';

export default function AttendanceChart({ data }: { data: TrendPoint[] }) {
  const model = useAttendanceChartData(data);

  return (
    <div className="relative w-full select-none" onMouseMove={model.handleMove} onMouseLeave={model.handleLeave}>
      <ChartCanvas model={model} data={data} />
      <ChartTooltip model={model} data={data} />
    </div>
  );
}
