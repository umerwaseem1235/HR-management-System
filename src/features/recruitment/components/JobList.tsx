'use client';

import React from 'react';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Pencil, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import type { Job } from '@/types';

interface JobListProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (job: Job) => void;
}

export default function JobList({ jobs, onEdit, onClose, onReopen, onDelete }: JobListProps) {
  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <div key={job.id} className="p-4 rounded-lg border border-medium-gray">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-primary dark:text-blue-gray-light">{job.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{job.department} · {job.branch} · {job.vacancies} opening{job.vacancies > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{job.description}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{job.applicants} applicants · Closing {job.closingDate}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={job.status === 'Open' ? 'success' : job.status === 'On Hold' ? 'warning' : 'neutral'}>{job.status}</Badge>
              <div className="flex gap-1.5">
                <button title="Edit vacancy" onClick={() => onEdit(job)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-950/40 cursor-pointer"><Pencil size={15} /></button>
                {job.status === 'Open'
                  ? <button title="Close vacancy" onClick={() => onClose(job.id)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-600 dark:text-red-400 cursor-pointer"><XCircle size={15} /></button>
                  : <button title="Reopen vacancy" onClick={() => onReopen(job.id)} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-200 cursor-pointer"><CheckCircle2 size={15} /></button>}
                <button title="Delete vacancy" onClick={() => onDelete(job)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-600 dark:text-red-400 cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {jobs.length === 0 && <EmptyState title="No vacancies" description="Create your first vacancy." />}
    </div>
  );
}
