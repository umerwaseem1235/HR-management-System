'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CalendarDays, ClipboardList, Plus } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { stripHtml } from '../../../utils/text';
import { formatDayMonYear } from '../../../utils/date';
import type { ProgressEntry } from '../../../lib/types';

interface EmployeeProgressProps {
  entries: ProgressEntry[];
  monthLabel: string;
}

const MAX_VISIBLE = 4;

export default function EmployeeProgress({ entries, monthLabel }: EmployeeProgressProps) {
  // Newest first, matching the Progress module ordering.
  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.submissionDate !== b.submissionDate) {
          return a.submissionDate < b.submissionDate ? 1 : -1;
        }
        return (b.createdOn || '').localeCompare(a.createdOn || '');
      }),
    [entries],
  );
  const visible = sorted.slice(0, MAX_VISIBLE);
  const remaining = sorted.length - visible.length;

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">My Progress</h3>
          {entries.length > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-teal/10 text-teal text-[11px] font-bold tabular-nums">
              {entries.length}
            </span>
          )}
        </div>
        {monthLabel && <Badge variant="info" size="sm">{monthLabel}</Badge>}
      </div>

      <div className="space-y-2.5 sm:space-y-3 flex-1 content-start">
        {visible.map((entry) => {
          // Descriptions are authored in a rich-text editor, so the stored value
          // is HTML. Render the plain-text form here or raw tags leak into the UI.
          const summary = stripHtml(entry.description);
          return (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 sm:gap-3 p-3 rounded-lg bg-blue-gray/50 border border-medium-gray"
            >
              <div className="w-9 h-9 rounded-lg bg-[#E3EFFE] flex items-center justify-center shrink-0">
                <ClipboardList size={16} className="text-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-dark-text dark:text-gray-100 truncate">
                    {entry.projectName}
                  </p>
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    <CalendarDays size={12} aria-hidden="true" />
                    {formatDayMonYear(entry.submissionDate)}
                  </span>
                </div>
                {summary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                    {summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            <div className="w-10 h-10 rounded-full bg-blue-gray/60 flex items-center justify-center mb-3">
              <ClipboardList size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-dark-text dark:text-gray-100">
              No progress posted{monthLabel ? ` in ${monthLabel}` : ''}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
              Share a short update on what you have worked on.
            </p>
          </div>
        )}

        {remaining > 0 && (
          <Link
            href="/progress"
            className="block text-center text-xs font-medium text-teal hover:underline pt-1"
          >
            +{remaining} more update{remaining > 1 ? 's' : ''} this month
          </Link>
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