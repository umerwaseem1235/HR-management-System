import React from 'react';
import StatCard from '../../ui/StatCard';
import type { StatGridItem } from '../dashboard-types';

interface DashboardStatsGridProps {
  items: StatGridItem[];
  /** Grid layout classes. Defaults to the admin 5-column layout. */
  className?: string;
  /** Optional wrapper class applied around each card (e.g. "min-w-0"). */
  itemWrapperClassName?: string;
}

export default function DashboardStatsGrid({
  items,
  className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 2xl:gap-4',
  itemWrapperClassName,
}: DashboardStatsGridProps) {
  return (
    <div className={className}>
      {items.map((item) => {
        const card = (
          <StatCard
            title={item.title}
            value={item.value}
            change={item.change}
            iconName={item.iconName}
            iconColor={item.iconColor}
            iconBg={item.iconBg}
          />
        );
        return itemWrapperClassName ? (
          <div key={item.title} className={itemWrapperClassName}>
            {card}
          </div>
        ) : (
          <React.Fragment key={item.title}>{card}</React.Fragment>
        );
      })}
    </div>
  );
}
