'use client';

import { CalendarDays, Download, Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import SearchBar from '../ui/SearchBar';
import type { Payslip } from '../../lib/types';
import type { MonthFilterOption } from './types';
import { money } from './payroll-helpers';

interface PayslipsTabProps {
  slips: Payslip[];
  filter: string;
  filterOptions: MonthFilterOption[];
  search: string;
  onFilter: (v: string) => void;
  onSearch: (v: string) => void;
  onView: (s: Payslip) => void;
  onDownload: (s: Payslip) => void;
}

export default function PayslipsTab({ slips, filter, filterOptions, search, onFilter, onSearch, onView, onDownload }: PayslipsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#17324D]">
          <CalendarDays size={16} className="text-[#0F8B8D]" /> Payroll Month
        </div>
        <div className="sm:w-64">
          <Select value={filter} onChange={e => onFilter(e.target.value)} options={filterOptions} />
        </div>
        <div className="flex-1 sm:max-w-xs sm:ml-auto">
          <SearchBar value={search} onChange={onSearch} placeholder="Search employee…" />
        </div>
      </div>
      <p className="text-xs text-gray-500">{slips.length} payslip(s)</p>

      {slips.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium text-[#17324D] mb-2">No payslips found</p>
          <p className="text-sm">Finalize a payroll run to generate payslips for this month.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slips.map(slip => (
            <div key={slip.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-3">
              <div>
                <p className="text-sm font-medium text-[#263238]">{slip.employeeName} — {slip.month} {slip.year}</p>
                <p className="text-xs text-gray-500">Gross: {money(slip.grossSalary)} | Deductions: {money(slip.deductions.reduce((s, d) => s + d.amount, 0))} | Net: {money(slip.netSalary)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slip.status === 'Finalized' ? 'success' : slip.status === 'Processed' ? 'info' : 'neutral'}>{slip.status}</Badge>
                <button onClick={() => onView(slip)} title="View payslip" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Eye size={16} /></button>
                <button onClick={() => onDownload(slip)} title="Download payslip (PDF)" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
