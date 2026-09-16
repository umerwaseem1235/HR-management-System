/**
 * Recruitment PDF section (`recruitment-pipeline`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockCandidates, mockJobs } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, sectionBar, titleBlock, todayLabel } from './utils';

export function renderRecruitmentReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['recruitment-pipeline'];
  const open = mockJobs.filter((j) => j.status === 'Open').length;
  const vacancies = mockJobs.reduce((s, j) => s + j.vacancies, 0);
  y = titleBlock(doc, y, meta.title, 'Open roles, vacancies and every candidate by stage with ratings', `Generated ${todayLabel()} · ${mockJobs.length} jobs · ${mockCandidates.length} candidates`);
  y = kpiStrip(doc, y, [
    { label: 'Open roles', value: String(open) },
    { label: 'Vacancies', value: String(vacancies) },
    { label: 'Candidates', value: String(mockCandidates.length) },
    { label: 'Selected', value: String(mockCandidates.filter((c) => c.stage === 'Selected').length) },
  ]);
  y = sectionBar(doc, y, 'OPEN ROLES — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Role', width: 56, align: 'left' },
      { label: 'Dept', width: 36, align: 'left' },
      { label: 'Vac.', width: 20, align: 'center' },
      { label: 'Applicants', width: 26, align: 'center' },
      { label: 'Status', width: 22, align: 'center' },
      { label: 'Closing', width: 22, align: 'center' },
    ],
    mockJobs.map((j) => [j.title, j.department, String(j.vacancies), String(j.applicants), j.status, j.closingDate]),
  );
  y = sectionBar(doc, y, 'CANDIDATES — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Candidate', width: 40, align: 'left' },
      { label: 'Role applied', width: 52, align: 'left' },
      { label: 'Stage', width: 30, align: 'center' },
      { label: 'Applied', width: 30, align: 'center' },
      { label: 'Rating', width: 30, align: 'center' },
    ],
    mockCandidates.map((c) => [c.name, c.jobTitle, c.stage, c.appliedDate, c.rating ? `${c.rating}/5` : '-']),
  );
  return y;
}
