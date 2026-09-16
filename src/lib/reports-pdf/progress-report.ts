/**
 * Progress PDF section (`progress`).
 *
 * Moved verbatim from `../reports-pdf.ts` — seed rows, the localStorage
 * reader (same storage key as the Progress module) and the renderer.
 * No behavior change.
 */

import { jsPDF } from 'jspdf';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, plainNote, sectionBar, titleBlock, todayLabel } from './utils';

export interface ProgressRow {
  projectName: string;
  description: string;
  submissionDate: string;
  employeeName: string;
}

export const PROGRESS_SEED: ProgressRow[] = [
  { projectName: 'BIG Team Progress', description: 'Sprint execution update, blockers cleared and milestones tracked for the BIG team.', submissionDate: '2026-09-01', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Daily delivery sync — completed modules reviewed and next-day plan aligned.', submissionDate: '2026-09-02', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'QA pass on released features with regression notes shared with stakeholders.', submissionDate: '2026-09-03', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Backend API progress — endpoints optimized and integration tests updated.', submissionDate: '2026-09-04', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Frontend milestone — dashboard widgets completed and pending design review.', submissionDate: '2026-09-05', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Weekend handover notes — open items documented for Monday kickoff.', submissionDate: '2026-09-07', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Client demo preparation — walkthrough script and release notes finalized.', submissionDate: '2026-09-08', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Deployment progress — staging verified and production checklist updated.', submissionDate: '2026-09-09', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Sprint retrospective inputs — velocity, risks and next-sprint scope drafted.', submissionDate: '2026-09-10', employeeName: 'Michael Chen' },
  { projectName: 'BIG Team Progress', description: 'Weekly consolidation — accomplishments, pending work and support needs.', submissionDate: '2026-09-11', employeeName: 'Michael Chen' },
];

/** Live progress entries (same storage key as the Progress module), seed fallback. */
export function readProgressEntries(): ProgressRow[] {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('hrms_progress_entries') : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((e) => e && typeof e.projectName === 'string')
          .map((e) => ({
            projectName: e.projectName,
            description: typeof e.description === 'string' ? e.description : '',
            submissionDate: e.submissionDate ?? '',
            employeeName: e.employeeName ?? '-',
          }));
      }
    }
  } catch {
    // Corrupt storage — fall through to seed
  }
  return PROGRESS_SEED;
}

export function renderProgressReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['progress'];
  const entries = readProgressEntries()
    .slice()
    .sort((a, b) => (a.submissionDate < b.submissionDate ? -1 : a.submissionDate > b.submissionDate ? 1 : 0));
  const projects = new Set(entries.map((e) => e.projectName)).size;
  const contributors = new Set(entries.map((e) => e.employeeName)).size;
  y = titleBlock(doc, y, meta.title, 'Daily progress updates with project, submitter and notes', `Generated ${todayLabel()} · ${entries.length} entries · ${projects} projects`);
  y = kpiStrip(doc, y, [
    { label: 'Entries', value: String(entries.length) },
    { label: 'Projects', value: String(projects) },
    { label: 'Contributors', value: String(contributors) },
    { label: 'Latest', value: entries[entries.length - 1]?.submissionDate ?? '-' },
  ]);
  y = sectionBar(doc, y, 'ENTRIES — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Date', width: 26, align: 'left' },
      { label: 'Employee', width: 36, align: 'left' },
      { label: 'Project', width: 38, align: 'left' },
      { label: 'Progress Note', width: 82, align: 'left' },
    ],
    entries.map((e) => [e.submissionDate, e.employeeName, e.projectName, plainNote(e.description) || '-']),
  );
  return y;
}
