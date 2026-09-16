'use client';

import Card from '../../ui/Card';
import type { Goal } from '../dashboard-types';

export default function EmployeeGoals({ goals }: { goals: Goal[] }) {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-[#17324D] mb-4">My Goals</h3>
      <div className="space-y-5">
        {goals.map(goal => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#263238]">{goal.title}</span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  goal.status === 'Completed'
                    ? 'bg-green-50 text-green-600'
                    : goal.status === 'In Progress'
                      ? 'bg-[#E8F1FE] text-[#1D6FE0]'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {goal.status}
              </span>
            </div>
            <div className="w-full bg-[#E8EEF3] rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#024fa7] to-[#5B9BFF] transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{goal.progress}% complete</span>
              <span>Due: {goal.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
