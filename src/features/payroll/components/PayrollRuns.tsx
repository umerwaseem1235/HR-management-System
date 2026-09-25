'use client';

import { AlertTriangle, Calculator, Download, Eye, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import { StatusBadge } from '@/components/shared';
import { formatCurrency as money } from '@/utils';
import type { PayrollRun } from '@/lib/payroll';

interface PayrollRunsProps {
  runs: PayrollRun[];
  newMonth: string;
  onNewMonthChange: (v: string) => void;
  newYear: string;
  onNewYearChange: (v: string) => void;
  runError: string;
  runErrorKey: number;
  onDismissError: () => void;
  onStart: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  yearOptions: { value: string; label: string }[];
  onReview: (id: string) => void;
  onExport: (run: PayrollRun) => void;
  onDeleteRequest: (run: PayrollRun) => void;
}

export default function PayrollRuns({
  runs, newMonth, onNewMonthChange, newYear, onNewYearChange, runError, runErrorKey, onDismissError, onStart,
  search, onSearchChange, monthOptions, yearOptions, onReview, onExport, onDeleteRequest,
}: PayrollRunsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-5">
        <h3 className="text-base font-semibold text-[#17324D] mb-1">Start a New Payroll Run</h3>
        <p className="text-xs text-gray-500 mb-4">Select the payroll month — gross salary, allowances, deductions and approved leave/attendance are calculated automatically for every employee.</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="sm:w-56">
            <Select
              label="Payroll Month"
              value={newMonth}
              onChange={e => onNewMonthChange(e.target.value)}
              options={monthOptions}
            />
          </div>
          <div className="sm:w-40">
            <Select
              label="Year"
              value={newYear}
              onChange={e => onNewYearChange(e.target.value)}
              options={yearOptions}
            />
          </div>
          <Button variant="primary" onClick={onStart}>
            <Calculator size={16} /> Start New Run
          </Button>
        </div>
        {runError && (
          <div key={runErrorKey} className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            <p className="flex-1">{runError}</p>
            <button onClick={onDismissError} title="Dismiss" aria-label="Dismiss error" className="rounded p-0.5 hover:bg-red-100">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <h3 className="text-base font-semibold text-[#17324D]">Payroll History ({runs.length})</h3>
          <div className="flex-1 sm:max-w-xs sm:ml-auto">
            <SearchBar value={search} onChange={onSearchChange} placeholder="Search month / year / status…" />
          </div>
        </div>
        <div className="space-y-3">
          {runs.map(run => {
            const formatTs = (ts: string) => {
              const d = new Date(ts);
              return isNaN(d.getTime()) ? ts : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            };
            return (
              <div key={run.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-white border border-[#D6E4E8] gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#17324D]">{run.month} {run.year} <span className="font-normal text-gray-400">· {run.id}</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    {run.items.length} employees · Gross {money(run.totalGross)} · Net {money(run.totalNet)} ·
                    Created {formatTs(run.createdOn)}{run.finalizedOn ? ` · Finalized ${formatTs(run.finalizedOn)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={run.status} />
                  <Button variant="outline" size="sm" onClick={() => onReview(run.id)}>
                    <Eye size={14} /> {run.status === 'Finalized' ? 'View' : 'Review'}
                  </Button>
                  <button onClick={() => onExport(run)} title="Export payroll summary (PDF)" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={16} /></button>
                  {run.status === 'Draft' && (
                    <button onClick={() => onDeleteRequest(run)} title="Delete draft run" className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
