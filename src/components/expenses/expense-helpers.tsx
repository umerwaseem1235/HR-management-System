import Badge from '../ui/Badge';

export function ExpenseStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Reimbursed: 'info',
  };
  return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
}
