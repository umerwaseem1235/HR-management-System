'use client';

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SearchBar from '../ui/SearchBar';
import EmptyState from '../ui/EmptyState';
import { Download, Clock, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import type { ReportId } from '../../lib/reports-pdf';

const reports: { id: ReportId; name: string; description: string; icon: typeof Clock; category: string; records: string }[] = [
  { id: 'attendance', name: 'Attendance Report', description: 'Daily, weekly, and monthly attendance summary', icon: Clock, category: 'Attendance', records: 'Daily records · hours + status' },
  { id: 'progress', name: 'Progress Report', description: 'Daily progress updates with notes in full', icon: TrendingUp, category: 'Progress', records: 'All entries · project + note' },
  { id: 'payroll-summary', name: 'Payroll Summary', description: 'Monthly payroll summary by department', icon: DollarSign, category: 'Payroll', records: 'All payslips · gross + net' },
  { id: 'expense-claims', name: 'Expense Claims Report', description: 'Expense claims by category and status', icon: Receipt, category: 'Finance', records: 'All claims · amounts + status' },
];

interface ExportLibraryProps {
  search: string;
  onSearchChange: (v: string) => void;
  downloading: ReportId | 'all' | null;
  onExport: (id: ReportId) => void;
}

export default function ExportLibrary({ search, onSearchChange, downloading, onExport }: ExportLibraryProps) {
  const filtered = reports.filter((r) =>
    !search.trim() || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-[#17324D]">Export Library</h3>
      <p className="text-sm text-gray-500 mt-0.5 mb-4">Attendance · Progress · Payroll · Expenses — full record-level PDFs</p>
      <Card padding="sm" className="mb-4">
        <div className="sm:max-w-sm">
          <SearchBar value={search} onChange={onSearchChange} placeholder="Search reports…" />
        </div>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="No reports found" description={`No reports match "${search}".`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => (
            <Card key={report.id} hover>
              <div className="flex items-start gap-3">
                <div className="bg-[#EAF2F4] p-3 rounded-lg"><report.icon size={22} className="text-[#024fa7]" /></div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[#17324D]">{report.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{report.records} · PDF</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExport(report.id)}
                      loading={downloading === report.id}
                      disabled={downloading !== null}
                    >
                      {!downloading && <Download size={14} />}
                      {downloading === report.id ? 'Exporting…' : 'Export'}
                    </Button>
                    <span className="text-xs text-gray-400">{report.category}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
