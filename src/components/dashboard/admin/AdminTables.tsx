'use client';

import { ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../../ui/Card';
import Avatar from '../../ui/Avatar';
import type { DepartmentCount, LeaveRequest, UpcomingEvent } from '../dashboard-types';

export function PendingLeavesCard({
  leaves,
  onViewAll,
}: {
  leaves: LeaveRequest[];
  onViewAll: () => void;
}) {
  const visibleLeaves = leaves.slice(0, 3);
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#17324D]">Pending Leave Approvals</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-[#024fa7] hover:underline font-medium flex items-center gap-1"
        >
          View All <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {visibleLeaves.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No pending approvals</p>
        ) : (
          visibleLeaves.map(leave => (
            <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
              <div className="flex items-center gap-3">
                <Avatar name={leave.employeeName} size="sm" />
                <div>
                  <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                  <p className="text-xs text-gray-500">
                    {leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                  <CheckCircle2 size={18} />
                </button>
                <button className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function DepartmentHeadcountCard({
  departments,
  maxCount,
  totalEmployees,
}: {
  departments: DepartmentCount[];
  maxCount: number;
  totalEmployees: number;
}) {
  return (
    <Card className="lg:col-span-2 !rounded-2xl !p-5 h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#EDF2FA]">
        <div className="flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-[#0B5CAD]" />
          <h3 className="text-[17px] font-bold text-[#0B5CAD] tracking-tight">Department Headcount</h3>
        </div>
        <span className="rounded-full bg-[#E8F1FC] px-3 py-1 text-[13px] font-bold text-[#1A64B4] whitespace-nowrap">
          {totalEmployees} Total
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-evenly">
        {departments.slice(0, 6).map(dept => (
          <div key={dept.name} className="flex items-center gap-3 py-[7px] px-2 -mx-2 rounded-lg hover:bg-[#F5F9FD] transition-colors">
            <span className="w-28 sm:w-36 shrink-0 truncate text-[13px] font-medium text-[#3B4E64]">{dept.name}</span>
            <div className="flex-1 h-2 rounded-full bg-[#EDF2FA] overflow-hidden">
              <div
                className={`${dept.fill ? '' : dept.color} h-full rounded-full transition-all duration-500`}
                style={{
                  width: `${(dept.count / Math.max(maxCount, 1)) * 100}%`,
                  minWidth: '8px',
                  ...(dept.fill ? { background: dept.fill } : {}),
                }}
              />
            </div>
            <span className="w-6 text-right text-[13px] font-bold tabular-nums text-[#17324D]">{dept.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function UpcomingEventsCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-[#17324D] mb-4">Upcoming Events</h3>
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              event.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <event.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#263238] truncate">{event.name}</p>
              <p className="text-xs text-gray-500 capitalize">{event.type === 'birthday' ? '🎂 Birthday' : event.type === 'anniversary' ? '🎉 Anniversary' : '📋 Probation End'}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{event.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
