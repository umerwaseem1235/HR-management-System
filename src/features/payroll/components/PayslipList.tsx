'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Download, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/shared';
import { formatCurrency as money } from '@/utils';
import type { Payslip } from '@/types';

interface PayslipListProps {
  slips: Payslip[];
  month: string;
  onMonthChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  /**
   * Legacy props, kept optional for compatibility. The view modal is driven
   * purely by LOCAL state now: any state update in usePayroll re-renders the
   * entire payroll page (stat cards + runs + every payslip row) before the
   * modal can paint — that round-trip was the visible "buffering" delay.
   */
  viewSlip?: Payslip | null;
  onView?: (slip: Payslip | null) => void;
  onDownload: (slip: Payslip) => void | Promise<void>;
}

const PayslipRow = memo(function PayslipRow({
  slip,
  downloading,
  onOpen,
  onDownload,
}: {
  slip: Payslip;
  downloading: boolean;
  onOpen: (slip: Payslip) => void;
  onDownload: (slip: Payslip) => void;
}) {
  const totalDeductions = slip.deductions.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#263238]">{slip.employeeName} — {slip.month} {slip.year}</p>
        <p className="text-xs text-gray-500">Gross: {money(slip.grossSalary)} | Deductions: {money(totalDeductions)} | Net: {money(slip.netSalary)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <StatusBadge status={slip.status} />
        <button
          type="button"
          onClick={() => onOpen(slip)}
          title="View payslip"
          aria-label={`View payslip for ${slip.employeeName}`}
          className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4] transition-colors cursor-pointer"
        >
          <Eye size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDownload(slip)}
          disabled={downloading}
          title="Download payslip (PDF)"
          aria-label={`Download payslip for ${slip.employeeName}`}
          className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4] transition-colors cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Download size={16} />
          )}
        </button>
      </div>
    </div>
  );
});

export default function PayslipList({ slips, month, onMonthChange, search, onSearchChange, onDownload }: PayslipListProps) {
  // Local-only modal state: opening the view NEVER touches usePayroll state,
  // so the click paints the modal immediately (no page-wide re-render).
  const [activeSlip, setActiveSlip] = useState<Payslip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Keep stable callback identities so PayslipRow memo actually hits — inline
  // closures were defeating the memo and re-rendering every row per click.
  const downloadRef = useRef(onDownload);
  useEffect(() => { downloadRef.current = onDownload; });
  const downloadingRef = useRef(false);

  const openSlip = useCallback((slip: Payslip) => {
    setActiveSlip(slip);
  }, []);

  const closeSlip = useCallback(() => {
    setActiveSlip(null);
  }, []);

  const downloadSlip = useCallback(async (slip: Payslip) => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloadingId(slip.id);
    try {
      await downloadRef.current(slip);
    } finally {
      downloadingRef.current = false;
      setDownloadingId(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#17324D]">
          <CalendarDays size={16} className="text-[#0F8B8D]" /> Payroll Month
        </div>
        <div className="sm:w-64 flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="month"
              aria-label="Payroll month"
              value={month === 'all' ? '' : month}
              onChange={e => onMonthChange(e.target.value || 'all')}
              className={month === 'all' ? 'text-transparent' : ''}
            />
            {month === 'all' && (
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                All months
              </span>
            )}
          </div>
          {month !== 'all' && (
            <button
              type="button"
              title="Show all months"
              onClick={() => onMonthChange('all')}
              className="shrink-0 rounded-lg border border-[#D6E4E8] px-3 py-2.5 text-xs font-semibold text-[#263238] hover:bg-[#EAF2F4] transition-colors"
            >
              All
            </button>
          )}
        </div>
        <div className="flex-1 sm:max-w-xs sm:ml-auto">
          <SearchBar value={search} onChange={onSearchChange} placeholder="Search employee…" />
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
            <PayslipRow
              key={slip.id}
              slip={slip}
              downloading={downloadingId === slip.id}
              onOpen={openSlip}
              onDownload={downloadSlip}
            />
          ))}
        </div>
      )}

      {/* ============ Payslip view modal (opens instantly, no data fetch) ============ */}
      <Modal isOpen={!!activeSlip} onClose={closeSlip} title={activeSlip ? `Payslip — ${activeSlip.month} ${activeSlip.year}` : 'Payslip'} size="lg">
        {activeSlip && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-[#17324D]">{activeSlip.employeeName}</p>
                <p className="text-xs text-gray-500">Generated {activeSlip.generatedOn}</p>
              </div>
              <StatusBadge status={activeSlip.status} />
            </div>
            <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
              <div className="flex justify-between bg-[#EAF2F4]/60 px-4 py-2.5 font-semibold text-[#17324D]">
                <span>Earnings</span><span>Amount</span>
              </div>
              <div className="flex justify-between px-4 py-2 border-t border-[#D6E4E8]"><span>Basic Salary</span><span className="font-medium">{money(activeSlip.basicSalary)}</span></div>
              {activeSlip.allowances.map(a => (
                <div key={a.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{a.name}</span><span>+{money(a.amount)}</span></div>
              ))}
              <div className="flex justify-between bg-[#EAF2F4]/40 px-4 py-2.5 border-t border-[#D6E4E8] font-bold text-[#17324D]"><span>Gross Salary</span><span>{money(activeSlip.grossSalary)}</span></div>
            </div>
            <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
              <div className="flex justify-between bg-red-50 px-4 py-2.5 font-semibold text-red-800">
                <span>Deductions</span><span>Amount</span>
              </div>
              {activeSlip.deductions.map(d => (
                <div key={d.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{d.name}</span><span>-{money(d.amount)}</span></div>
              ))}
              <div className="flex justify-between bg-[#17324D] px-4 py-3 font-bold text-white"><span>Net Salary</span><span>{money(activeSlip.netSalary)}</span></div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => downloadSlip(activeSlip)}><Download size={14} /> Download</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
