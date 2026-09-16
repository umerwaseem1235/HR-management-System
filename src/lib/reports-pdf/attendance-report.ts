/**
 * Attendance-family PDF sections (`attendance`, `late-early`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockAttendance } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, sectionBar, titleBlock, todayLabel } from './utils';

export function renderAttendanceReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['attendance'];
  const present = mockAttendance.filter((a) => a.status === 'Present').length;
  const avgHrs = mockAttendance.reduce((s, a) => s + a.workHours, 0) / Math.max(1, mockAttendance.length);
  y = titleBlock(doc, y, meta.title, 'Daily attendance with check-in, check-out, hours and overtime', `Generated ${todayLabel()} · ${mockAttendance.length} records · Date: 2024-01-08`);
  y = kpiStrip(doc, y, [
    { label: 'Records', value: String(mockAttendance.length) },
    { label: 'Present', value: String(present) },
    { label: 'Avg hours', value: avgHrs.toFixed(1) },
    { label: 'Overtime entries', value: String(mockAttendance.filter((a) => a.overtime > 0).length) },
  ]);
  y = sectionBar(doc, y, 'ATTENDANCE DETAIL — ALL RECORDS');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 46, align: 'left' },
      { label: 'Date', width: 26, align: 'center' },
      { label: 'In', width: 18, align: 'center' },
      { label: 'Out', width: 18, align: 'center' },
      { label: 'Status', width: 28, align: 'center' },
      { label: 'Hrs', width: 18, align: 'right' },
      { label: 'OT', width: 28, align: 'right' },
    ],
    mockAttendance.map((a) => [a.employeeName, a.date, a.checkIn || '-', a.checkOut || '-', a.status, a.workHours.toFixed(1), a.overtime.toFixed(1)]),
  );
  return y;
}

export function renderLateEarlyReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['late-early'];
  const flagged = mockAttendance.filter((a) => a.status === 'Late' || a.status === 'Half Day');
  y = titleBlock(doc, y, meta.title, 'Late arrivals and early / partial-day departures with full shift context', `Generated ${todayLabel()} · ${flagged.length} flagged of ${mockAttendance.length} records`);
  y = kpiStrip(doc, y, [
    { label: 'Flagged', value: String(flagged.length) },
    { label: 'Late', value: String(mockAttendance.filter((a) => a.status === 'Late').length) },
    { label: 'Half day', value: String(mockAttendance.filter((a) => a.status === 'Half Day').length) },
    { label: 'Flag rate', value: `${Math.round((flagged.length / Math.max(1, mockAttendance.length)) * 100)}%` },
  ]);
  y = sectionBar(doc, y, 'FLAGGED RECORDS — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 48, align: 'left' },
      { label: 'Date', width: 28, align: 'center' },
      { label: 'Check-in', width: 26, align: 'center' },
      { label: 'Check-out', width: 26, align: 'center' },
      { label: 'Status', width: 28, align: 'center' },
      { label: 'Hours', width: 26, align: 'right' },
    ],
    flagged.map((a) => [a.employeeName, a.date, a.checkIn || '-', a.checkOut || '-', a.status, a.workHours.toFixed(1)]),
  );
  return y;
}
