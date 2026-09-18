'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { AttendanceRecord, Employee } from '../lib/types';
import { getEmployees } from '@/lib/actions/employees';
import { getAllAttendance, createAttendanceRecord, getCorrections, updateCorrectionStatus } from '@/lib/actions/attendance';
import {
  toDateStr, timeToMinutes, todayStr, aggregate,
  initialHolidays,
} from '../components/attendance/attendance-utils';
import type {
  CorrectionRequest, Holiday, ManualEntryValues,
  SummaryMode, AttendanceAggregate,
} from '../components/attendance/types';

export interface AdminAttendanceData {
  activeTab: string;
  onActiveTab: (tab: string) => void;
  viewDate: string;
  onViewDate: (v: string) => void;
  dayRecords: AttendanceRecord[];
  manualOpen: boolean;
  onManualOpen: () => void;
  onManualClose: () => void;
  onAddManual: (values: ManualEntryValues) => void;
  summaryMode: SummaryMode;
  onSummaryMode: (m: SummaryMode) => void;
  summaryCounts: AttendanceRecord[];
  agg: AttendanceAggregate;
  summaryLabel: string;
  corrections: CorrectionRequest[];
  pendingCorrections: CorrectionRequest[];
  onApproveCorrection: (id: string) => void;
  onRejectCorrection: (id: string) => void;
  holidays: Holiday[];
  holidayMsg: string;
  onAddHoliday: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteHoliday: (id: string) => void;
  adminTabs: { id: string; label: string; count?: number }[];
}

export function useAdminAttendance(): AdminAttendanceData {
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('daily');
  const [manualOpen, setManualOpen] = useState(false);
  const [viewDate, setViewDate] = useState(todayStr());
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('daily');
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [holidayMsg, setHolidayMsg] = useState('');

  const [attendRecords, setAttendRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [empData, attData, corrData] = await Promise.all([
          getEmployees(),
          getAllAttendance(),
          getCorrections()
        ]);
        setEmployees(empData);
        setAttendRecords(attData);
        setCorrections(corrData);
      } catch (error) {
        console.error('Failed to load admin attendance data:', error);
      }
    }
    loadData();
  }, []);

  const dayRecords = attendRecords.filter((r) => r.date === viewDate);

  const summaryCounts = useMemo(() => {
    if (summaryMode === 'daily') {
      return dayRecords;
    }
    if (summaryMode === 'weekly') {
      const anchor = new Date(viewDate);
      const day = anchor.getDay();
      const diff = anchor.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(anchor.setDate(diff));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const from = toDateStr(mon);
      const to = toDateStr(sun);
      return attendRecords.filter((r) => r.date >= from && r.date <= to);
    }
    const prefix = viewDate.slice(0, 7);
    return attendRecords.filter((r) => r.date.startsWith(prefix));
  }, [summaryMode, viewDate, dayRecords, attendRecords]);

  const agg = aggregate(summaryCounts);

  const pendingCorrections = corrections.filter((c) => c.status === 'Pending');

  const summaryLabel =
    summaryMode === 'daily'
      ? `Daily Summary — ${viewDate}`
      : summaryMode === 'weekly'
        ? `Weekly Summary — Week of ${viewDate}`
        : `Monthly Summary — ${viewDate.slice(0, 7)}`;

  const adminTabs = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'summaries', label: 'Summaries' },
    { id: 'corrections', label: 'Corrections', count: pendingCorrections.length },
    { id: 'config', label: 'Holidays' },
  ];

  const handleAddManual = useCallback(async (values: ManualEntryValues) => {
    const emp = employees.find((e) => e.id === values.employeeId);
    if (!emp) return;
    const inMin = values.checkIn ? timeToMinutes(values.checkIn) : 0;
    const outMin = values.checkOut ? timeToMinutes(values.checkOut) : 0;
    let workHours = 0;
    if (inMin && outMin && outMin > inMin) workHours = Math.round(((outMin - inMin) / 60) * 10) / 10;
    else if (values.status === 'Present' || values.status === 'Late') workHours = 8;
    else if (values.status === 'Half Day') workHours = 4;

    try {
      const newRecord = await createAttendanceRecord({
        employeeId: emp.id,
        date: values.date,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        status: values.status as AttendanceRecord['status'],
        workHours,
        overtime: 0,
        notes: values.notes || undefined,
      });
      setAttendRecords((current) => {
        const without = current.filter((r) => !(r.employeeId === emp.id && r.date === values.date));
        return [newRecord, ...without];
      });
      setViewDate(values.date);
    } catch (err) {
      console.error('Failed to add manual record:', err);
    }
  }, [employees]);

  const handleApproveCorrection = useCallback(async (id: string) => {
    try {
      await updateCorrectionStatus(id, 'Approved');
      setCorrections((current) =>
        current.map((c) => {
          if (c.id !== id) return c;
          if (c.status === 'Pending') {
            setAttendRecords((recs) =>
              recs.map((r) => {
                if (r.employeeId === c.employeeId && r.date === c.date) {
                  const updated: AttendanceRecord = {
                    ...r,
                    status: c.requestedStatus as AttendanceRecord['status'],
                    checkIn: c.requestedCheckIn ?? r.checkIn,
                    checkOut: c.requestedCheckOut ?? r.checkOut,
                  };
                  const inMin = updated.checkIn ? timeToMinutes(updated.checkIn) : 0;
                  const outMin = updated.checkOut ? timeToMinutes(updated.checkOut) : 0;
                  if (inMin && outMin && outMin > inMin)
                    updated.workHours = Math.round(((outMin - inMin) / 60) * 10) / 10;
                  else if (updated.status === 'Present' || updated.status === 'Late') updated.workHours = 8;
                  else if (updated.status === 'Half Day') updated.workHours = 4;
                  return updated;
                }
                return r;
              }),
            );
          }
          return { ...c, status: 'Approved' as const };
        }),
      );
    } catch (err) {
      console.error('Failed to approve correction:', err);
    }
  }, []);

  const handleRejectCorrection = useCallback(async (id: string) => {
    try {
      await updateCorrectionStatus(id, 'Rejected');
      setCorrections((current) => current.map((c) => (c.id === id ? { ...c, status: 'Rejected' as const } : c)));
    } catch (err) {
      console.error('Failed to reject correction:', err);
    }
  }, []);

  const handleAddHoliday = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get('holidayName') || '').trim();
      const date = String(fd.get('holidayDate') || '');
      const type = String(fd.get('holidayType') || 'Public');
      if (!name || !date) return;
      setHolidays((current) => [
        ...current,
        { id: `h-${Date.now()}`, name, date, type: type as Holiday['type'] },
      ]);
      addNotification({
        title: 'New Holiday Announced',
        message: `${name} on ${date} (${type}) — notified to all employees.`,
        type: 'info',
        link: '/attendance',
      });
      setHolidayMsg(`${name} on ${date} added — notification sent to all employees.`);
      e.currentTarget.reset();
    },
    [addNotification],
  );

  const handleDeleteHoliday = useCallback((id: string) => {
    setHolidays((current) => current.filter((x) => x.id !== id));
  }, []);

  return {
    activeTab,
    onActiveTab: setActiveTab,
    viewDate,
    onViewDate: setViewDate,
    dayRecords,
    manualOpen,
    onManualOpen: () => setManualOpen(true),
    onManualClose: () => setManualOpen(false),
    onAddManual: handleAddManual,
    summaryMode,
    onSummaryMode: setSummaryMode,
    summaryCounts,
    agg,
    summaryLabel,
    corrections,
    pendingCorrections,
    onApproveCorrection: handleApproveCorrection,
    onRejectCorrection: handleRejectCorrection,
    holidays,
    holidayMsg,
    onAddHoliday: handleAddHoliday,
    onDeleteHoliday: handleDeleteHoliday,
    adminTabs,
  };
}
