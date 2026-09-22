'use client';

import React, { useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Send, Trash2,
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Code2, Link2, Minus,
  User, Mail, Briefcase, CalendarDays, ClipboardList, StickyNote,
} from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import type { ProgressEntry } from '@/types';
import { formatSubmission, stripHtml } from '../hooks/useProgressView';

const QUICK_EMOJI = ['✅', '⭐', '🔥', '🎯', '💡', '🚀', '📌', '💎'];

/** Lightweight rich-text note editor — project-themed toolbar over a contentEditable area. */
function RichNoteEditor({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled after mount — React must not rewrite innerHTML on each
  // keystroke or the caret jumps. Remounted via key when switching entries.
  const initialHtml = useRef(value);

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el;
    if (el && !el.dataset.init) {
      el.innerHTML = initialHtml.current;
      el.dataset.init = '1';
    }
  };

  const emit = () => {
    onChange(ref.current?.innerHTML ?? '');
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      // Unsupported command — ignore
    }
    emit();
  };

  const insertEmoji = (emoji: string) => {
    ref.current?.focus();
    try {
      document.execCommand('insertText', false, emoji);
    } catch {
      // Fallback: append
      onChange(`${value}${emoji}`);
    }
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Enter link URL (https://…)');
    if (url && url.trim()) run('createLink', url.trim());
  };

  const toolBtn =
    'flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[#EAF2F4] hover:text-[#024fa7] cursor-pointer';
  const divider = <span className="mx-0.5 h-5 w-px bg-[#D6E4E8]" />;

  return (
    <div>
      <div className={`overflow-hidden rounded-lg border bg-white transition-colors ${error ? 'border-red-500' : 'border-[#D6E4E8] focus-within:border-[#024fa7] focus-within:ring-2 focus-within:ring-[#024fa7]/20'}`}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[#D6E4E8] bg-[#F8FBFC] px-2 py-1.5">
          <button type="button" title="Bold" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('bold')}><Bold size={15} /></button>
          <button type="button" title="Italic" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('italic')}><Italic size={15} /></button>
          <button type="button" title="Underline" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('underline')}><Underline size={15} /></button>
          {divider}
          <button type="button" title="Bullet list" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertUnorderedList')}><List size={15} /></button>
          <button type="button" title="Numbered list" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertOrderedList')}><ListOrdered size={15} /></button>
          {divider}
          <button type="button" title="Heading 1" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'H1')}><Heading1 size={15} /></button>
          <button type="button" title="Heading 2" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'H2')}><Heading2 size={15} /></button>
          {divider}
          <button type="button" title="Quote" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'BLOCKQUOTE')}><Quote size={15} /></button>
          <button type="button" title="Code" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'PRE')}><Code2 size={15} /></button>
          <button type="button" title="Link" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={addLink}><Link2 size={15} /></button>
          <button type="button" title="Divider" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertHorizontalRule')}><Minus size={15} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-1 border-b border-[#D6E4E8] bg-white px-3 py-1.5">
          {QUICK_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              title={`Insert ${e}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => insertEmoji(e)}
              className="rounded-md px-1 py-0.5 text-base leading-none transition-transform hover:scale-125 cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
        <div className="relative">
          <div
            ref={setRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onBlur={emit}
            className="min-h-[140px] px-4 py-3 text-sm leading-relaxed text-[#263238] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#17324D] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#17324D] [&_blockquote]:border-l-2 [&_blockquote]:border-[#D6E4E8] [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_pre]:rounded-md [&_pre]:bg-[#EAF2F4] [&_pre]:px-2 [&_pre]:py-1 [&_pre]:text-xs [&_a]:text-[#024fa7] [&_a]:underline"
          />
          {!stripHtml(value) && placeholder && (
            <div className="pointer-events-none absolute left-4 top-3 select-none text-sm text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

/** View-modal section card with an overlapping legend label (matches reference design). */
function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative mt-3 rounded-xl border border-[#D6E4E8] bg-white px-4 pb-4 pt-5">
      <span className="absolute -top-2.5 left-4 bg-white px-2 text-[11px] font-bold uppercase tracking-wider text-[#024fa7]">
        {title}
      </span>
      {children}
    </div>
  );
}

function ViewField({
  icon,
  label,
  value,
  wide,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        <span className="text-gray-400">{icon}</span> {label}
      </p>
      <p className="text-sm font-medium text-[#263238]">{value}</p>
    </div>
  );
}

interface ProgressModalProps {
  showFormModal: boolean;
  editingId: string | null;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  submissionDate: string;
  onSubmissionDateChange: (value: string) => void;
  description: string;
  onDescriptionChange: (html: string) => void;
  formErrors: Record<string, string>;
  projectNames: string[];
  stats: { words: number; chars: number };
  onCloseForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
  viewing: ProgressEntry | null;
  onCloseViewing: () => void;
  confirmDeleteEntry: ProgressEntry | null;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

export default function ProgressModal(props: ProgressModalProps) {
  const {
    showFormModal, editingId,
    projectName, onProjectNameChange,
    submissionDate, onSubmissionDateChange,
    description, onDescriptionChange,
    formErrors, projectNames, stats,
    onCloseForm, onSubmit,
    viewing, onCloseViewing,
    confirmDeleteEntry, onCloseDeleteConfirm, onConfirmDelete,
  } = props;
  const { employees } = useEmployeeDirectory();

  return (
    <>
      {/* Add / Edit modal — matches the reference design, dressed in project theme */}
      <Modal
        isOpen={showFormModal}
        onClose={onCloseForm}
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
              placeholder="e.g. CodeQor HRMS Portal"
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
            <Button variant="outline" type="button" onClick={onCloseForm}>Cancel</Button>
            <Button variant="primary" type="submit">
              <Send size={16} /> {editingId ? 'Update Progress' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View modal — assignment / timeline / notes sections like the reference */}
      <Modal
        isOpen={!!viewing}
        onClose={onCloseViewing}
        title="View Progress"
        size="lg"
      >
        {viewing && (() => {
          const emp = employees.find((e) =>
            viewing.employeeId
              ? e.id === viewing.employeeId
              : `${e.firstName} ${e.lastName}`.toLowerCase() === viewing.employeeName.toLowerCase(),
          );
          return (
            <div>
              <ViewSection title="Assignment Details">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ViewField icon={<User size={13} />} label="Employee Name" value={viewing.employeeName} />
                  <ViewField icon={<Mail size={13} />} label="Employee Email" value={emp?.email ?? '—'} />
                  <ViewField icon={<Briefcase size={13} />} label="Project" value={viewing.projectName} wide />
                </div>
              </ViewSection>
              <ViewSection title="Timeline">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ViewField icon={<CalendarDays size={13} />} label="Submission Date" value={formatSubmission(viewing.submissionDate)} />
                  <ViewField icon={<ClipboardList size={13} />} label="Progress Type" value="Daily Update" />
                </div>
              </ViewSection>
              <ViewSection title="Work Summary & Notes">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <span className="text-gray-400"><StickyNote size={13} /></span> Detailed Note
                </p>
                <div
                  dangerouslySetInnerHTML={{ __html: viewing.description || '<p>—</p>' }}
                  className="max-h-[40vh] space-y-2 overflow-y-auto text-sm leading-relaxed text-[#263238] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#17324D] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#17324D] [&_blockquote]:border-l-2 [&_blockquote]:border-[#D6E4E8] [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_pre]:rounded-md [&_pre]:bg-[#EAF2F4] [&_pre]:px-2 [&_pre]:py-1 [&_pre]:text-xs [&_a]:text-[#024fa7] [&_a]:underline"
                />
              </ViewSection>
              <div className="flex justify-end pt-5">
                <Button variant="outline" type="button" onClick={onCloseViewing}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteEntry}
        onClose={onCloseDeleteConfirm}
        title="Delete Progress Entry?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{confirmDeleteEntry?.projectName}</span>?
          </>
        }
        subline={confirmDeleteEntry ? `${confirmDeleteEntry.employeeName} · ${formatSubmission(confirmDeleteEntry.submissionDate)}` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The progress entry will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
