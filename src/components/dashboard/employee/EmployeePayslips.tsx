'use client';

import { FileText } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import type { Payslip } from '../dashboard-types';

export default function EmployeePayslips({ payslips }: { payslips: Payslip[] }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-[#17324D] mb-4">Recent Payslips</h3>
      <div className="space-y-3">
        {payslips.slice(0, 3).map(slip => (
          <div key={slip.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#263238]">{slip.month} {slip.year}</p>
                <p className="text-xs text-gray-500">Generated: {slip.generatedOn}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#17324D]">${slip.netSalary.toLocaleString()}</p>
              <Badge variant="success" size="sm">Paid</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
