'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { DollarSign, FileText, Calculator, Download, Eye } from 'lucide-react';
import { mockPayslips, mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';

export default function PayrollPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payslips');
  const isAdmin = user?.role !== 'employee';

  const totalPayroll = mockEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

  const tabs = isAdmin ? [
    { id: 'payslips', label: 'Payslips' },
    { id: 'runs', label: 'Payroll Runs' },
    { id: 'structures', label: 'Salary Structures' },
  ] : [{ id: 'payslips', label: 'My Payslips' }];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Compensation"
          title="Payroll"
          subtitle="Payslips, payroll runs and salary structures"
          actions={isAdmin && <Button variant="primary"><Calculator size={16} /> Process Payroll</Button>}
        />

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Monthly Payroll" value={`$${Math.round(totalPayroll / 12).toLocaleString()}`} icon={<DollarSign size={22} className="text-green-600" />} iconBg="bg-green-50" />
            <StatCard title="Total Employees" value={mockEmployees.length} icon={<FileText size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
            <StatCard title="Payroll Status" value="Processed" icon={<Calculator size={22} className="text-purple-600" />} iconBg="bg-purple-50" />
          </div>
        )}

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'payslips' && (
              <div className="space-y-3">
                {mockPayslips.map(slip => (
                  <div key={slip.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#263238]">{slip.employeeName} — {slip.month} {slip.year}</p>
                      <p className="text-xs text-gray-500">Gross: ${slip.grossSalary.toLocaleString()} | Deductions: ${slip.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString()} | Net: ${slip.netSalary.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={slip.status === 'Finalized' ? 'success' : slip.status === 'Processed' ? 'info' : 'neutral'}>{slip.status}</Badge>
                      <button className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Eye size={16} /></button>
                      <button className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'runs' && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium text-[#17324D] mb-2">Payroll Runs</p>
                <p className="text-sm">Manage and process payroll runs by month.</p>
                <Button variant="primary" className="mt-4"><Calculator size={16} /> Start New Run</Button>
              </div>
            )}
            {activeTab === 'structures' && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium text-[#17324D] mb-2">Salary Structures</p>
                <p className="text-sm">Define and manage salary components, allowances, and deductions.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
