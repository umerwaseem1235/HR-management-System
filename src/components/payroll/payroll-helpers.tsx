import React from 'react';
import { Lock } from 'lucide-react';
import Badge from '../ui/Badge';
import type { PayrollRun } from '../../lib/payroll';

export const money = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;

export function RunStatusBadge({ status }: { status: PayrollRun['status'] }) {
  if (status === 'Finalized')
    return (
      <Badge variant="success">
        <span className="inline-flex items-center gap-1">
          <Lock size={12} /> Finalized
        </span>
      </Badge>
    );
  if (status === 'Reviewed') return <Badge variant="info">Reviewed</Badge>;
  return <Badge variant="warning">Draft</Badge>;
}
