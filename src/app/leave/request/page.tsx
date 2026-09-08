'use client';

import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { LEAVE_TYPES } from '../../../lib/constants';

export default function LeaveRequestPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/leave" className="inline-flex items-center gap-2 text-sm text-[#0F8B8D] hover:underline">
          <ArrowLeft size={16} /> Back to Leave
        </Link>
        <h1 className="text-2xl font-bold text-[#17324D]">Request Leave</h1>
        <Card>
          <div className="space-y-5">
            <Select label="Leave Type" options={[{ value: '', label: 'Select Leave Type' }, ...LEAVE_TYPES.map(lt => ({ value: lt.id, label: `${lt.name} (${lt.daysAllowed} days)` }))]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start Date" type="date" />
              <Input label="End Date" type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Reason</label>
              <textarea rows={4} placeholder="Enter reason for leave..." className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Attachment (optional)</label>
              <input type="file" className="text-sm text-gray-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
              <Button variant="outline">Cancel</Button>
              <Button variant="primary"><Send size={16} /> Submit Request</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
