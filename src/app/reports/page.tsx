'use client';

import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Download, FileText, Users, Clock, CalendarDays, DollarSign, Briefcase, TrendingUp, Receipt, Shield } from 'lucide-react';

const reports = [
  { name: 'Employee Master Report', description: 'Complete employee directory with all details', icon: Users, category: 'HR' },
  { name: 'Headcount Report', description: 'Employee count by department, designation, and branch', icon: Users, category: 'HR' },
  { name: 'Attendance Report', description: 'Daily, weekly, and monthly attendance summary', icon: Clock, category: 'Attendance' },
  { name: 'Late/Early Report', description: 'Late arrivals and early departures', icon: Clock, category: 'Attendance' },
  { name: 'Leave Balance Report', description: 'Leave balances across all employees', icon: CalendarDays, category: 'Leave' },
  { name: 'Leave Utilization Report', description: 'Leave usage patterns and trends', icon: CalendarDays, category: 'Leave' },
  { name: 'Payroll Summary', description: 'Monthly payroll summary by department', icon: DollarSign, category: 'Payroll' },
  { name: 'Recruitment Pipeline', description: 'Candidates by stage and source', icon: Briefcase, category: 'Recruitment' },
  { name: 'Performance Reviews', description: 'Review completion status and ratings', icon: TrendingUp, category: 'Performance' },
  { name: 'Expense Claims Report', description: 'Expense claims by category and status', icon: Receipt, category: 'Finance' },
  { name: 'Audit Activity Log', description: 'System activity and change history', icon: Shield, category: 'Security' },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Insights"
          title="Reports"
          subtitle="Export HR analytics across every module"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, i) => (
            <Card key={i} hover>
              <div className="flex items-start gap-3">
                <div className="bg-[#EAF2F4] p-3 rounded-lg"><report.icon size={22} className="text-[#024fa7]" /></div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[#17324D]">{report.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm"><Download size={14} /> Export</Button>
                    <span className="text-xs text-gray-400">{report.category}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
