'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import { Building2, MapPin, Clock, Trash2 } from 'lucide-react';
import { DEPARTMENTS, BRANCHES, SHIFTS, LEAVE_TYPES } from '../../lib/constants';
import SettingsForm from '../../components/settings/SettingsForm';
import SettingsSection from '../../components/settings/SettingsSection';

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
          title="Settings"
        />

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'company' && (
              <SettingsForm />
            )}
            {activeTab === 'departments' && (
              <SettingsSection title="Departments" addLabel="Add Department">
                {DEPARTMENTS.map((dept, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8] hover:bg-[#EAF2F4]/50">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-[#024fa7]" />
                      <span className="text-sm font-medium text-[#263238]">{dept}</span>
                    </div>
                    <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'branches' && (
              <SettingsSection title="Branches" addLabel="Add Branch">
                {BRANCHES.map(branch => (
                  <div key={branch.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#024fa7]" />
                      <div><p className="text-sm font-medium text-[#263238]">{branch.name}</p><p className="text-xs text-gray-500">{branch.city}</p></div>
                    </div>
                    <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'shifts' && (
              <SettingsSection title="Work Shifts" addLabel="Add Shift">
                {SHIFTS.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-[#024fa7]" />
                      <div><p className="text-sm font-medium text-[#263238]">{shift.name}</p><p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime}</p></div>
                    </div>
                    <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'leave' && (
              <SettingsSection title="Leave Types & Policies" addLabel="Add Leave Type">
                {LEAVE_TYPES.map(lt => (
                  <div key={lt.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                      <div>
                        <p className="text-sm font-medium text-[#263238]">
                          {lt.name}
                          {lt.period === 'month' && (
                            <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">Monthly</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{lt.daysAllowed} days/{lt.period === 'month' ? 'month · resets monthly' : 'year'} · {lt.carryForward ? 'Carry forward' : 'No carry forward'}{lt.description ? ` · ${lt.description}` : ''}</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
