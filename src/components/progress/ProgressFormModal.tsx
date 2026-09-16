'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Send } from 'lucide-react';
import RichNoteEditor from './RichNoteEditor';

interface ProgressFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  projectName: string;
  submissionDate: string;
  description: string;
  formErrors: Record<string, string>;
  projectNames: string[];
  stats: { words: number; chars: number };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onProjectNameChange: (v: string) => void;
  onSubmissionDateChange: (v: string) => void;
  onDescriptionChange: (html: string) => void;
}

export default function ProgressFormModal({
  isOpen,
  editingId,
  projectName,
  submissionDate,
  description,
  formErrors,
  projectNames,
  stats,
  onClose,
  onSubmit,
  onProjectNameChange,
  onSubmissionDateChange,
  onDescriptionChange,
}: ProgressFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Progress' : 'Add Progress'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Project</label>
          <input
            list="progress-projects"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="e.g. BIG Team Progress"
            className={`w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none transition-colors ${formErrors.projectName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
          />
          <datalist id="progress-projects">
            {projectNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {formErrors.projectName && <p className="mt-1 text-sm text-red-500">{formErrors.projectName}</p>}
        </div>
        <Input
          label="Date"
          type="date"
          value={submissionDate}
          onChange={(e) => onSubmissionDateChange(e.target.value)}
          error={formErrors.submissionDate}
        />
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-[#263238]">
              Note <span className="font-normal text-gray-400">(Rich Text)</span>
            </label>
            <span className="shrink-0 text-xs text-gray-400">
              {stats.words} words <span className="mx-1 text-gray-300">•</span> {stats.chars} chars
            </span>
          </div>
          <RichNoteEditor
            key={editingId ?? 'new'}
            value={description}
            onChange={onDescriptionChange}
            placeholder="Summarize what was accomplished, blockers cleared, next steps…"
            error={formErrors.description}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            <Send size={16} /> {editingId ? 'Update Progress' : 'Add Progress'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
