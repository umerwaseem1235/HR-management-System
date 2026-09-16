'use client';

import Badge from '../ui/Badge';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
    Present: 'success', Absent: 'danger', Late: 'warning', 'Half Day': 'info', Leave: 'info', Holiday: 'neutral', Weekend: 'neutral',
  };
  return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
}
