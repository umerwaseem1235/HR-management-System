'use client';

import React, { useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SearchBar from '../../components/ui/SearchBar';
import {
  Plus, Eye, Pencil, Trash2, Send, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Code2, Link2, Minus,
  User, Mail, Briefcase, CalendarDays, ClipboardList, StickyNote,
} from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useProgress } from '../../contexts/ProgressContext';
import { ProgressEntry } from '../../lib/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatSubmission(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

const PAGE_SIZES = [5, 10, 20];

function stripHtml(html: string): string {
  return html
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function noteStats(html: string): { words: number; chars: number } {
  const text = stripHtml(html);
  return {
    words: text ? text.split(' ').filter(Boolean).length : 0,
    chars: text.length,
  };
}

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

export default function ProgressPage() {
  const { user } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry } = useProgress();

  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [viewing, setViewing] = useState<ProgressEntry | null>(null);

  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find(
        (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase(),
      )
    );
  }, [user]);

  const isEmployee = user?.role === 'employee';

  // Employees only see their own progress; admins/HR see everything
  const visible = useMemo(() => {
    if (!isEmployee) return entries;
    if (!user) return [];
    return entries.filter((e) =>
      employee ? e.employeeId === employee.id : e.employeeName.toLowerCase() === user.name.toLowerCase(),
    );
  }, [entries, isEmployee, employee, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible
      .filter((e) => {
        if (q && !`${e.projectName} ${e.description}`.toLowerCase().includes(q)) return false;
        if (fromDate && e.submissionDate < fromDate) return false;
        if (toDate && e.submissionDate > toDate) return false;
        return true;
      })
      .sort((a, b) => (a.submissionDate < b.submissionDate ? -1 : a.submissionDate > b.submissionDate ? 1 : 0));
  }, [visible, query, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filtered.length);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const projectNames = useMemo(
    () => Array.from(new Set(entries.map((e) => e.projectName))).sort(),
    [entries],
  );

  const stats = useMemo(() => noteStats(description), [description]);

  if (!user) return null;

  const resetForm = () => {
    setEditingId(null);
    setProjectName('');
    setSubmissionDate('');
    setDescription('');
    setFormErrors({});
  };

  const openAdd = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEdit = (entry: ProgressEntry) => {
    setEditingId(entry.id);
    setProjectName(entry.projectName);
    setSubmissionDate(entry.submissionDate);
    setDescription(entry.description);
    setFormErrors({});
    setShowFormModal(true);
  };

  const closeForm = () => {
    setShowFormModal(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!projectName.trim()) nextErrors.projectName = 'Please enter a project name.';
    if (!submissionDate) nextErrors.submissionDate = 'Submission date is required.';
    if (!stripHtml(description)) nextErrors.description = 'Please add a short progress summary.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingId) {
      updateEntry(editingId, {
        projectName: projectName.trim(),
        submissionDate,
        description: description.trim(),
      });
    } else {
      addEntry({
        projectName: projectName.trim(),
        submissionDate,
        description: description.trim(),
        employeeId: employee?.id ?? user.id,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
      });
    }
    closeForm();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Progress"
          actions={
            <Button variant="primary" onClick={openAdd}>
              <Plus size={16} /> Add Progress
            </Button>
          }
        />

        <Card padding="sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <SearchBar
              value={query}
              onChange={(v) => { setQuery(v); setPage(1); }}
              placeholder="Search by project name…"
              className="flex-1"
            />
            <div className="grid grid-cols-2 gap-3 lg:w-auto">
              <Input
                type="date"
                aria-label="From date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              />
              <Input
                type="date"
                aria-label="To date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </Card>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Submission Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {pageRows.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#263238]">{entry.projectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatSubmission(entry.submissionDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View"
                          onClick={() => setViewing(entry)}
                          className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => { if (window.confirm('Delete this progress entry?')) deleteEntry(entry.id); }}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageRows.length === 0 && (
              <div className="p-6">
                <EmptyState
                  title="No progress entries"
                  description={query || fromDate || toDate ? 'No entries match your filters. Try clearing them.' : 'Click “Add Progress” to log your first update.'}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#D6E4E8] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Records per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-[#D6E4E8] bg-white px-2 py-1.5 text-sm text-[#263238] outline-none focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500">{start} - {end} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                title="First page"
                className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous page"
                className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-8 h-8 rounded-lg text-sm font-medium bg-[#024fa7] text-white flex items-center justify-center">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next page"
                className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last page"
                className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Add / Edit modal — matches the reference design, dressed in project theme */}
      <Modal
        isOpen={showFormModal}
        onClose={closeForm}
        title={editingId ? 'Edit Progress' : 'Add Progress'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">Project</label>
            <input
              list="progress-projects"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
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
            onChange={(e) => setSubmissionDate(e.target.value)}
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
              onChange={(html) => {
                setDescription(html);
                setFormErrors((prev) => {
                  if (!prev.description) return prev;
                  const next = { ...prev };
                  delete next.description;
                  return next;
                });
              }}
              placeholder="Summarize what was accomplished, blockers cleared, next steps…"
              error={formErrors.description}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={closeForm}>Cancel</Button>
            <Button variant="primary" type="submit">
              <Send size={16} /> {editingId ? 'Update Progress' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View modal — assignment / timeline / notes sections like the reference */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="View Progress"
        size="lg"
      >
        {viewing && (() => {
          const emp = mockEmployees.find((e) =>
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
                <Button variant="outline" type="button" onClick={() => setViewing(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </DashboardLayout>
  );
}
