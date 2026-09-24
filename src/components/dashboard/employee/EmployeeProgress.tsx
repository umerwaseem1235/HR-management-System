'use client';

import Link from 'next/link';
import { CalendarDays, ClipboardList, Plus } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import type { ProgressEntry } from '../../../lib/types';

interface EmployeeProgressProps {
  entries: ProgressEntry[];
  monthLabel: string;
}

function fmtDay(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  if (isNaN(d.getTime())) return ds;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EmployeeProgress({ entries, monthLabel }: EmployeeProgressProps) {
  const visible = entries.slice(0, 4);
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#17324D]">My Progress</h3>
        <Badge variant="info" size="sm">{monthLabel}</Badge>
      </div>
      <div className="space-y-3 flex-1 content-start">
        {visible.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
            <div className="w-9 h-9 rounded-lg bg-[#E3EFFE] flex items-center justify-center shrink-0">
              <ClipboardList size={16} className="text-[#024fa7]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#263238] truncate">{entry.projectName}</p>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500">
                  <CalendarDays size={12} /> {fmtDay(entry.submissionDate)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.description}</p>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-gray-500 py-6 text-center">No progress posted in {monthLabel}.</p>
        )}
      </div>
      <div className="mt-auto pt-4 flex justify-end">
        <Link href="/progress">
          <Button variant="outline" size="sm">
            <Plus size={14} /> Post Update
          </Button>
        </Link>
      </div>
    </Card>
  );
}
