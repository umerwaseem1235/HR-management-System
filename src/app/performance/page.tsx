'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Target, Star, TrendingUp, Plus, Pencil, Trash2, Send, Paperclip, ExternalLink, ClipboardList, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { mockPerformanceReviews, mockGoals, mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useWork } from '../../contexts/WorkContext';

function normalizeLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const { workItems, addWork, updateWork, deleteWork, updateWorkStatus } = useWork();
  const [activeTab, setActiveTab] = useState('reviews');
  const isEmployee = user?.role === 'employee';

  // Daily-work form state (shared by add + edit)
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [workLink, setWorkLink] = useState('');
  const [workFileData, setWorkFileData] = useState('');
  const [workFileName, setWorkFileName] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [workErrors, setWorkErrors] = useState<Record<string, string>>({});
  const [viewingFile, setViewingFile] = useState<{ data: string; name: string } | null>(null);

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // Employees only see their own submitted work
  const myWork = useMemo(() => {
    if (!user) return [];
    return workItems.filter((w) =>
      employee ? w.employeeId === employee.id : w.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [workItems, employee, user]);

  if (!user) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, 'info' | 'success' | 'warning'> = {
      Submitted: 'info', Approved: 'success', 'Needs Revision': 'warning',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const resetWorkForm = () => {
    setEditingId(null);
    setWorkTitle('');
    setWorkDescription('');
    setWorkDate('');
    setWorkLink('');
    setWorkFileData('');
    setWorkFileName('');
    setFileKey((k) => k + 1);
    setWorkErrors({});
  };

  const openAddWork = () => {
    resetWorkForm();
    setShowWorkModal(true);
  };

  const openEditWork = (id: string) => {
    const item = workItems.find((w) => w.id === id);
    if (!item) return;
    setEditingId(item.id);
    setWorkTitle(item.title);
    setWorkDescription(item.description);
    setWorkDate(item.date);
    setWorkLink(item.link ?? '');
    setWorkFileData(item.fileData ?? '');
    setWorkFileName(item.fileName ?? (item.fileData ? 'Attached file' : ''));
    setWorkErrors({});
    setShowWorkModal(true);
  };

  const closeWorkModal = () => {
    setShowWorkModal(false);
    resetWorkForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setWorkFileData('');
      setWorkFileName('');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setWorkErrors((prev) => ({ ...prev, file: 'File must be smaller than 2MB.' }));
      return;
    }
    setWorkErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    const reader = new FileReader();
    reader.onload = () => {
      setWorkFileData(reader.result as string);
      setWorkFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!workTitle.trim()) nextErrors.title = 'Please enter a task/work title.';
    if (!workDescription.trim()) nextErrors.description = 'Please describe the work completed.';
    if (!workDate) nextErrors.date = 'Date is required.';
    if (workLink.trim() && workLink.trim().length < 4) nextErrors.link = 'Please enter a valid link.';
    setWorkErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      title: workTitle.trim(),
      description: workDescription.trim(),
      date: workDate,
      fileData: workFileData || undefined,
      fileName: workFileName || undefined,
      link: normalizeLink(workLink) || undefined,
    };

    if (editingId) {
      updateWork(editingId, payload);
    } else {
      addWork({
        employeeId: employee?.id ?? user.id,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
        ...payload,
      });
    }
    closeWorkModal();
  };

  const renderWorkCard = (item: (typeof workItems)[number], showEmployee: boolean, allowReview: boolean) => (
    <div key={item.id} className="p-4 rounded-lg border border-[#D6E4E8] bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showEmployee && <Avatar name={item.employeeName} size="sm" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#17324D] truncate">{item.title}</p>
            {showEmployee && <p className="text-xs text-gray-500">{item.employeeName}</p>}
            <p className="text-xs text-gray-400">{item.date}</p>
          </div>
        </div>
        {statusBadge(item.status)}
      </div>
      <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{item.description}</p>
      {(item.fileName || item.link) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {item.fileName && item.fileData && (
            <button
              type="button"
              onClick={() => setViewingFile({ data: item.fileData!, name: item.fileName! })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F8B8D] bg-[#EAF2F4] hover:bg-[#D6E4E8] rounded-lg px-3 py-1.5"
            >
              <Paperclip size={12} /> {item.fileName}
            </button>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F8B8D] bg-[#EAF2F4] hover:bg-[#D6E4E8] rounded-lg px-3 py-1.5"
            >
              <ExternalLink size={12} /> View link
            </a>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#D6E4E8]">
        <p className="text-[11px] text-gray-400">Submitted on {item.submittedOn}</p>
        <div className="flex gap-2">
          {allowReview && item.status === 'Submitted' && (
            <>
              <button
                title="Approve"
                onClick={() => updateWorkStatus(item.id, 'Approved')}
                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                title="Needs Revision"
                onClick={() => updateWorkStatus(item.id, 'Needs Revision')}
                className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              >
                <AlertCircle size={16} />
              </button>
            </>
          )}
          {!allowReview && item.status !== 'Approved' && (
            <>
              <button
                title="Edit"
                onClick={() => openEditWork(item.id)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Pencil size={16} />
              </button>
              <button
                title="Delete"
                onClick={() => { if (window.confirm('Delete this work entry?')) deleteWork(item.id); }}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------- Employee view: My Daily Work ----------------
  if (isEmployee) {
    const submittedCount = myWork.filter((w) => w.status === 'Submitted').length;
    const approvedCount = myWork.filter((w) => w.status === 'Approved').length;
    const revisionCount = myWork.filter((w) => w.status === 'Needs Revision').length;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#17324D]">My Daily Work</h1>
            <Button variant="primary" onClick={openAddWork}><Plus size={16} /> Add Daily Work</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="bg-[#EAF2F4] p-2.5 rounded-lg"><ClipboardList size={20} className="text-[#0F8B8D]" /></div>
                <div><p className="text-lg font-bold text-[#17324D]">{myWork.length}</p><p className="text-xs text-gray-500">Total Entries</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg"><Send size={20} className="text-blue-600" /></div>
                <div><p className="text-lg font-bold text-[#17324D]">{submittedCount}</p><p className="text-xs text-gray-500">Submitted</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2.5 rounded-lg"><CheckCircle2 size={20} className="text-green-600" /></div>
                <div><p className="text-lg font-bold text-[#17324D]">{approvedCount}</p><p className="text-xs text-gray-500">Approved</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-50 p-2.5 rounded-lg"><AlertCircle size={20} className="text-yellow-600" /></div>
                <div><p className="text-lg font-bold text-[#17324D]">{revisionCount}</p><p className="text-xs text-gray-500">Needs Revision</p></div>
              </div>
            </Card>
          </div>

          <Card padding="none">
            <div className="px-6 py-4 border-b border-[#D6E4E8]">
              <h3 className="text-base font-semibold text-[#17324D]">My Work History</h3>
            </div>
            <div className="p-6">
              {myWork.length === 0 ? (
                <EmptyState
                  title="No work submitted yet"
                  description="Click “Add Daily Work” to log your first entry."
                />
              ) : (
                <div className="space-y-3">
                  {myWork.map((item) => renderWorkCard(item, false, false))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Modal isOpen={showWorkModal} onClose={closeWorkModal} title={editingId ? 'Edit Daily Work' : 'Add Daily Work'} size="lg">
          <form onSubmit={handleWorkSubmit} className="space-y-5">
            <Input label="Task / Work Title" placeholder="e.g. Fixed login validation bug" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} error={workErrors.title} />
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Description of the work completed</label>
              <textarea
                rows={4}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Describe what you worked on today..."
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${workErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#0F8B8D] focus:ring-[#0F8B8D]/20'}`}
              />
              {workErrors.description && <p className="mt-1 text-sm text-red-500">{workErrors.description}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Date" type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} error={workErrors.date} />
              <Input label="Link (optional)" placeholder="https://..." value={workLink} onChange={(e) => setWorkLink(e.target.value)} error={workErrors.link} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Upload Work / File (optional)</label>
              <input
                key={fileKey}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#EAF2F4] file:text-[#17324D] hover:file:bg-[#D6E4E8]"
              />
              {workErrors.file && <p className="mt-1 text-sm text-red-500">{workErrors.file}</p>}
              {workFileName && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[#263238] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-3 py-2">
                  <Paperclip size={14} className="text-[#0F8B8D] flex-shrink-0" />
                  <span className="truncate flex-1">{workFileName}</span>
                  <button
                    type="button"
                    title="Remove file"
                    onClick={() => { setWorkFileData(''); setWorkFileName(''); setFileKey((k) => k + 1); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
              <Button variant="outline" type="button" onClick={closeWorkModal}>Cancel</Button>
              <Button variant="primary" type="submit">
                <Send size={16} /> {editingId ? 'Save Changes' : 'Submit Work'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!viewingFile} onClose={() => setViewingFile(null)} title={viewingFile?.name ?? 'Attached file'} size="lg">
          {viewingFile?.data.startsWith('data:application/pdf') ? (
            <iframe src={viewingFile.data} title="Attached file" className="w-full h-[65vh] rounded-lg border border-[#D6E4E8]" />
          ) : viewingFile ? (
            <img src={viewingFile.data} alt="Attached work file" className="w-full max-h-[65vh] object-contain rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/40" />
          ) : null}
        </Modal>
      </DashboardLayout>
    );
  }

  // ---------------- Admin / HR view: unchanged + Daily Work review ----------------
  const tabs = [
    { id: 'reviews', label: 'Reviews', count: mockPerformanceReviews.filter(r => r.status !== 'Completed').length },
    { id: 'goals', label: 'Goals' },
    { id: 'daily-work', label: 'Daily Work', count: workItems.filter(w => w.status === 'Submitted').length },
    { id: 'cycles', label: 'Cycles' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <PageHeader
          eyebrow="Growth"
          title="Performance Management"
          subtitle="Reviews, goals and appraisal cycles at a glance"
        />

        {/* Compact metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card padding="none" hover>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="bg-purple-50 p-2 rounded-xl shrink-0"><Target size={18} className="text-purple-600" /></div>
              <div className="min-w-0 leading-tight">
                <p className="text-xl font-extrabold tracking-tight text-[#17324D]">{mockPerformanceReviews.length}</p>
                <p className="text-xs text-gray-500 truncate">Total Reviews</p>
              </div>
            </div>
          </Card>
          <Card padding="none" hover>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="bg-yellow-50 p-2 rounded-xl shrink-0"><Star size={18} className="text-yellow-600" /></div>
              <div className="min-w-0 leading-tight">
                <p className="text-xl font-extrabold tracking-tight text-[#17324D]">{mockPerformanceReviews.filter(r => r.status !== 'Completed').length}</p>
                <p className="text-xs text-gray-500 truncate">Pending Reviews</p>
              </div>
            </div>
          </Card>
          <Card padding="none" hover>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="bg-green-50 p-2 rounded-xl shrink-0"><TrendingUp size={18} className="text-green-600" /></div>
              <div className="min-w-0 leading-tight">
                <p className="text-xl font-extrabold tracking-tight text-[#17324D]">{mockGoals.length}</p>
                <p className="text-xs text-gray-500 truncate">Active Goals</p>
              </div>
            </div>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="px-4 sm:px-5 pt-3 bg-[#F8FBFC]/60 border-b border-[#D6E4E8]/70"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-4 sm:p-5">
            {activeTab === 'reviews' && (
              <div className="divide-y divide-[#D6E4E8]/70 overflow-hidden rounded-xl border border-[#D6E4E8]/70">
                {mockPerformanceReviews.map(review => (
                  <div key={review.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3 transition-colors hover:bg-[#EAF2F4]/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={review.employeeName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#263238]">{review.employeeName}</p>
                        <p className="truncate text-xs text-gray-500">{review.cycleName}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      {review.managerRating && <div className="flex items-center gap-1 text-yellow-500"><Star size={14} fill="currentColor" /><span className="text-sm font-medium">{review.managerRating}/5</span></div>}
                      <Badge variant={review.status === 'Completed' ? 'success' : 'warning'}>{review.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'goals' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockGoals.map(goal => (
                  <div key={goal.id} className="rounded-xl border border-[#D6E4E8]/70 bg-white p-4 transition-shadow hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#263238]">{goal.title}</h4>
                      <span className="shrink-0"><Badge variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'info' : 'neutral'}>{goal.status}</Badge></span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{goal.description}</p>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-[#D6E4E8]/60">
                      <div className="h-1.5 rounded-full bg-[#0F8B8D]" style={{ width: `${goal.progress}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-gray-500">
                      <span>{goal.progress}%</span><span>Due: {goal.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'daily-work' && (
              <div>
                {workItems.length === 0 ? (
                  <EmptyState
                    title="No daily work submitted"
                    description="Employee work submissions will appear here for review."
                  />
                ) : (
                  <div className="space-y-3">
                    {workItems.map((item) => renderWorkCard(item, true, true))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'cycles' && (
              <div className="text-center py-10 text-gray-500">
                <p className="text-base font-semibold text-[#17324D] mb-1.5">Performance Cycles</p>
                <p className="text-sm">Manage review cycles and timelines.</p>
                <Button variant="primary" size="sm" className="mt-4"><Target size={16} /> Create Cycle</Button>
              </div>
            )}
          </div>
        </Card>

        <Modal isOpen={!!viewingFile} onClose={() => setViewingFile(null)} title={viewingFile?.name ?? 'Attached file'} size="lg">
          {viewingFile?.data.startsWith('data:application/pdf') ? (
            <iframe src={viewingFile.data} title="Attached file" className="w-full h-[65vh] rounded-lg border border-[#D6E4E8]" />
          ) : viewingFile ? (
            <img src={viewingFile.data} alt="Attached work file" className="w-full max-h-[65vh] object-contain rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/40" />
          ) : null}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
