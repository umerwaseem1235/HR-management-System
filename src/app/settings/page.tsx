'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Building2, MapPin, Clock, Save, Plus, Trash2 } from 'lucide-react';
import { DEPARTMENTS, BRANCHES, SHIFTS, LEAVE_TYPES } from '../../lib/constants';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'departments', label: 'Departments' },
    { id: 'branches', label: 'Branches' },
    { id: 'shifts', label: 'Shifts' },
    { id: 'leave', label: 'Leave Policies' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          subtitle="Company, departments, branches, shifts and leave policies"
        />

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'company' && (
              <div className="max-w-2xl space-y-5">
                <h3 className="text-base font-semibold text-[#17324D]">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Company Name" defaultValue="CodeQor Inc." />
                  <Input label="Registration No." defaultValue="REG-2018-001" />
                  <Input label="Email" defaultValue="contact@codeqor.com" />
                  <Input label="Phone" defaultValue="+1-555-0000" />
                  <Input label="Address" defaultValue="100 Tech Avenue, New York, NY" className="sm:col-span-2" />
                  <Input label="Website" defaultValue="https://codeqor.com" />
                  <Input label="Tax ID" defaultValue="TAX-123456" />
                </div>
                <div className="flex justify-end pt-4"><Button variant="primary"><Save size={16} /> Save Changes</Button></div>
              </div>
            )}
            {activeTab === 'departments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#17324D]">Departments</h3>
                  <Button variant="primary" size="sm"><Plus size={16} /> Add Department</Button>
                </div>
                <div className="space-y-2">
                  {DEPARTMENTS.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8] hover:bg-[#EAF2F4]/50">
                      <div className="flex items-center gap-3">
                        <Building2 size={16} className="text-[#024fa7]" />
                        <span className="text-sm font-medium text-[#263238]">{dept}</span>
                      </div>
                      <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'branches' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#17324D]">Branches</h3>
                  <Button variant="primary" size="sm"><Plus size={16} /> Add Branch</Button>
                </div>
                <div className="space-y-2">
                  {BRANCHES.map(branch => (
                    <div key={branch.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-[#024fa7]" />
                        <div><p className="text-sm font-medium text-[#263238]">{branch.name}</p><p className="text-xs text-gray-500">{branch.city}</p></div>
                      </div>
                      <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'shifts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#17324D]">Work Shifts</h3>
                  <Button variant="primary" size="sm"><Plus size={16} /> Add Shift</Button>
                </div>
                <div className="space-y-2">
                  {SHIFTS.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-[#024fa7]" />
                        <div><p className="text-sm font-medium text-[#263238]">{shift.name}</p><p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime}</p></div>
                      </div>
                      <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'leave' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#17324D]">Leave Types & Policies</h3>
                  <Button variant="primary" size="sm"><Plus size={16} /> Add Leave Type</Button>
                </div>
                <div className="space-y-2">
                  {LEAVE_TYPES.map(lt => (
                    <div key={lt.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                        <div><p className="text-sm font-medium text-[#263238]">{lt.name}</p><p className="text-xs text-gray-500">{lt.daysAllowed} days/year · {lt.carryForward ? 'Carry forward' : 'No carry forward'}</p></div>
                      </div>
                      <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
