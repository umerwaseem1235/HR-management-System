'use client';

import Card from '../../ui/Card';
import type { QuickStatItem } from '../dashboard-types';

export default function QuickStatsRow({ items }: { items: QuickStatItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 2xl:gap-4">
      {items.map((item) => (
        <Card key={item.label} padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <item.icon size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{item.value}</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
