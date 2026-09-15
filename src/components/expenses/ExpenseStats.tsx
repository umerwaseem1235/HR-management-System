import Card from '../ui/Card';
import { DollarSign, CheckCircle2 } from 'lucide-react';

interface ExpenseStatsProps {
  totalPending: number;
  approvedCount: number;
  reimbursedCount: number;
}

export default function ExpenseStats({ totalPending, approvedCount, reimbursedCount }: ExpenseStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] p-2 rounded-lg shadow-md ring-1 ring-black/5"><DollarSign size={18} strokeWidth={1.6} className="text-[#024fa7]" /></div>
          <div><p className="text-lg font-bold text-[#17324D]">${totalPending.toLocaleString()}</p><p className="text-xs text-gray-500">Pending Amount</p></div>
        </div>
      </Card>
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] p-2 rounded-lg shadow-md ring-1 ring-black/5"><CheckCircle2 size={18} strokeWidth={1.6} className="text-[#024fa7]" /></div>
          <div><p className="text-lg font-bold text-[#17324D]">{approvedCount}</p><p className="text-xs text-gray-500">Approved</p></div>
        </div>
      </Card>
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] p-2 rounded-lg shadow-md ring-1 ring-black/5"><DollarSign size={18} strokeWidth={1.6} className="text-[#024fa7]" /></div>
          <div><p className="text-lg font-bold text-[#17324D]">{reimbursedCount}</p><p className="text-xs text-gray-500">Reimbursed</p></div>
        </div>
      </Card>
    </div>
  );
}
