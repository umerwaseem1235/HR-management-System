'use client';

import Card from '../../ui/Card';
import Select from '../../ui/Select';
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
        <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Attendance Trend</h3>
        <div className="w-28 shrink-0">
          <Select
            size="sm"
            ariaLabel="Attendance trend range"
            value={range}
            onChange={(e) => onRangeChange(e.target.value as 'week' | 'month')}
            options={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
        </div>
      </div>
      <AttendanceChart key={range} data={data} />
    </Card>
  );
}
