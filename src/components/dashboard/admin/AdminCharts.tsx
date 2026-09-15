'use client';

import { ChevronDown } from 'lucide-react';
import Card from '../../ui/Card';
import AttendanceChart from '../AttendanceChart';
import type { TrendPoint } from '../dashboard-types';

interface AdminChartsProps {
  range: 'week' | 'month';
  onRangeChange: (range: 'week' | 'month') => void;
  data: TrendPoint[];
}

export default function AdminCharts({ range, onRangeChange, data }: AdminChartsProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#17324D]">Attendance Trend</h3>
        <div className="relative">
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value as 'week' | 'month')}
            className="appearance-none rounded-full border border-[#D6E4E8] bg-white pl-3.5 pr-9 py-1.5 text-xs font-semibold text-[#263238] focus:border-[#024fa7] focus:outline-none cursor-pointer"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>
      <AttendanceChart key={range} data={data} />
    </Card>
  );
}
