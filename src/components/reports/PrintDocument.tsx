'use client';

import React from 'react';
import { PRINT_STATUS_COLOR, slash, stripHtml, type AttendanceDayRow, type TabId } from './report-utils';
import type { ProgressEntry, DailyWork } from '../../lib/types';

interface PrintDocumentProps {
  tab: TabId;
  title: string;
  from: string;
  to: string;
  scopeName: string;
  attendanceRows: AttendanceDayRow[];
  progressRows: ProgressEntry[];
  taskRows: DailyWork[];
  rowCount: number;
}

export default function PrintDocument({
  tab,
  title,
  from,
  to,
  scopeName,
  attendanceRows,
  progressRows,
  taskRows,
  rowCount,
}: PrintDocumentProps) {
  return (
    <div className="report-print-area">
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>CodQor HRMS</h1>
        <h2 style={{ fontSize: 13, fontWeight: 600, margin: '6px 0 0' }}>{title}</h2>
        <p style={{ fontSize: 11, margin: '4px 0 0' }}>
          From: {from} <span style={{ margin: '0 12px' }}>To: {to}</span> <span>Employee: {scopeName}</span>
        </p>
      </div>
      {tab === 'attendance' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Sr#', 'Date & Day', 'Clock In', 'Clock Out', 'Working Hours', 'Status'].map((h) => (
                <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map((r, i) => (
              <tr key={r.date}>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.date}<br />{r.weekday}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.clockIn}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.clockOut}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.hours}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px', color: PRINT_STATUS_COLOR[r.status], fontWeight: 700 }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'progress' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Sr#', 'Date', 'Employee Name', 'Project Title', 'Progress Note'].map((h) => (
                <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {progressRows.map((e, i) => (
              <tr key={e.id}>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{slash(e.submissionDate)}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.employeeName}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.projectName}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{stripHtml(e.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'task' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Sr#', 'Date', 'Employee Name', 'Title', 'Details', 'Status'].map((h) => (
                <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taskRows.map((w, i) => (
              <tr key={w.id}>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{slash(w.date)}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.employeeName}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.title}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.description}</td>
                <td style={{ border: '1px solid #333', padding: '4px 6px', fontWeight: 700 }}>{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: 10, marginTop: 8 }}>Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')} · {rowCount} records · CodQor HRMS</p>
    </div>
  );
}
