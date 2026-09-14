'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { Download, Users, Clock, CalendarDays, DollarSign, Briefcase, TrendingUp, Receipt, Shield, FileDown } from 'lucide-react';
import { downloadReport, downloadAllReportsPack, type ReportId } from '../../lib/reports-pdf';

const reports: { id: ReportId; name: string; description: string; icon: typeof Users; category: string; records: string }[] = [
  { id: 'employee-master', name: 'Employee Master Report', description: 'Complete employee directory with all details', icon: Users, category: 'HR', records: '15 employees · full profiles' },
  { id: 'headcount', name: 'Headcount Report', description: 'Employee count by department, designation, and branch', icon: Users, category: 'HR', records: 'Dept · branch · status breakdown' },
  { id: 'attendance', name: 'Attendance Report', description: 'Daily, weekly, and monthly attendance summary', icon: Clock, category: 'Attendance', records: '12 daily records · hours + OT' },
  { id: 'late-early', name: 'Late/Early Report', description: 'Late arrivals and early departures', icon: Clock, category: 'Attendance', records: 'Flagged late & half-day records' },
  { id: 'leave-balance', name: 'Leave Balance Report', description: 'Leave balances across all employees', icon: CalendarDays, category: 'Leave', records: '4 leave types + all requests' },
  { id: 'leave-utilization', name: 'Leave Utilization Report', description: 'Leave usage patterns and trends', icon: CalendarDays, category: 'Leave', records: 'By type · 6 requests in full' },
  { id: 'payroll-summary', name: 'Payroll Summary', description: 'Monthly payroll summary by department', icon: DollarSign, category: 'Payroll', records: 'All payslips · gross + net' },
  { id: 'recruitment-pipeline', name: 'Recruitment Pipeline', description: 'Candidates by stage and source', icon: Briefcase, category: 'Recruitment', records: '4 roles · 6 candidates' },
  { id: 'performance-reviews', name: 'Performance Reviews', description: 'Review completion status and ratings', icon: TrendingUp, category: 'Performance', records: 'Ratings · comments · status' },
  { id: 'expense-claims', name: 'Expense Claims Report', description: 'Expense claims by category and status', icon: Receipt, category: 'Finance', records: 'All claims · amounts + status' },
  { id: 'audit-log', name: 'Audit Activity Log', description: 'System activity and change history', icon: Shield, category: 'Security', records: 'Every event · before → after' },
];

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<ReportId | 'all' | null>(null);
  const filtered = reports.filter(r =>
    !search.trim() || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleExport = (id: ReportId) => {
    if (downloading) return;
    setDownloading(id);
    // Let the button paint its loading state before the (synchronous) PDF build.
    setTimeout(() => {
      try {
        downloadReport(id);
      } finally {
        setDownloading(null);
      }
    }, 60);
  };

  const handleExportAll = () => {
    if (downloading) return;
    setDownloading('all');
    setTimeout(() => {
      try {
        downloadAllReportsPack();
      } finally {
        setDownloading(null);
      }
    }, 60);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          actions={
            <Button variant="primary" size="md" onClick={handleExportAll} loading={downloading === 'all'} disabled={downloading !== null}>
              {!downloading && <FileDown size={16} />}
              {downloading === 'all' ? 'Building pack…' : 'Download all (PDF pack)'}
            </Button>
          }
        />
        <p className="text-sm text-gray-500 -mt-4">Export HR analytics across every module — each PDF carries full record-level detail</p>

        <Card padding="sm">
          <div className="sm:max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder="Search reports…" />
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
                      onClick={() => handleExport(report.id)}
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
    </DashboardLayout>
  );
}
