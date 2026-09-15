'use client';

import { ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import type { DepartmentCount, LeaveRequest, UpcomingEvent } from '../dashboard-types';

export function PendingLeavesCard({
  leaves,
  onViewAll,
}: {
  leaves: LeaveRequest[];
  onViewAll: () => void;
}) {
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
        {leaves.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No pending approvals</p>
        ) : (
          leaves.map(leave => (
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
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-[#17324D]">Department Headcount</h3>
        <Badge variant="default">{totalEmployees} Total</Badge>
      </div>
      <div className="space-y-4">
        {departments.slice(0, 6).map(dept => (
          <div key={dept.name} className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[#263238] w-32 truncate">{dept.name}</span>
            <div className="flex-1 bg-[#EAF2F4] rounded-full h-2.5 overflow-hidden">
              <div
                className={`${dept.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${(dept.count / maxCount) * 100}%`, minWidth: '8px' }}
              />
            </div>
            <span className="w-6 text-right text-xs font-semibold tabular-nums text-[#17324D]">{dept.count}</span>
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
