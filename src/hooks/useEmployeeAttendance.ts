'use client';

import { useState, useMemo, useEffect } from 'react';
import { useEmployee } from './useEmployee';
import { useLeave } from '../contexts/LeaveContext';
import type { AttendanceRecord, User } from '../lib/types';
import { toDateStr, buildMonthlySchedule } from '../components/attendance/attendance-utils';
import { getAttendanceByEmployee } from '@/lib/actions/attendance';

export interface EmployeeAttendanceData {
  user: User | null;
  monthLabel: string;
  records: AttendanceRecord[];
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leavesTaken: number;
  selectedDate: string;
  statusFilter: string;
  onSelectedDate: (v: string) => void;
  onStatusFilter: (v: string) => void;
}

export function useEmployeeAttendance(): EmployeeAttendanceData {
  const { user, employee, employeeId, employeeName, isEmployee } = useEmployee();
  const { leaveRequests } = useLeave();

  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      if (employeeId) {
        try {
          const data = await getAttendanceByEmployee(employeeId);
          setAttendanceRecords(data);
        } catch (error) {
          console.error('Failed to load employee attendance:', error);
        }
      }
    }
    loadData();
  }, [employeeId]);

  const { monthLabel, monthlyRecords, presentDays, absentDays, lateDays, leavesTaken } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const empty = {
      monthLabel,
      monthlyRecords: [] as AttendanceRecord[],
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      leavesTaken: 0,
    };

    if (!user || !isEmployee) return empty;

    const empId = employee?.id ?? '';
    const empName = employee ? `${employee.firstName} ${employee.lastName}` : user.name;
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const realMonthly = attendanceRecords.filter((a) => a.date.startsWith(monthPrefix));
    const realDates = new Set(realMonthly.map((r) => r.date));

    // Fill gaps with generated schedule
    const generated = empId
      ? buildMonthlySchedule(empId, empName, year, month).filter((r) => !realDates.has(r.date))
      : [];

    const monthlyRecords = [...realMonthly, ...generated].sort((a, b) => (a.date < b.date ? 1 : -1));

    const presentDays = monthlyRecords.filter((r) => r.status === 'Present').length;
    const absentDays = monthlyRecords.filter((r) => r.status === 'Absent').length;
    const lateDays = monthlyRecords.filter((r) => r.status === 'Late').length;
    const attendanceLeaveDates = new Set(
      monthlyRecords.filter((r) => r.status === 'Leave').map((r) => r.date),
    );

    // Count approved leave days that overlap with the current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let approvedLeaveDays = 0;
    leaveRequests
      .filter(
        (l) =>
          (empId
            ? l.employeeId === empId
            : l.employeeName.toLowerCase() === user.name.toLowerCase()) && l.status === 'Approved',
      )
      .forEach((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
          const ds = toDateStr(d);
          if (!attendanceLeaveDates.has(ds)) approvedLeaveDays++;
        }
      });

    return {
      monthLabel,
      monthlyRecords,
      presentDays,
      absentDays,
      lateDays,
      leavesTaken: attendanceLeaveDates.size + approvedLeaveDays,
    };
  }, [user, isEmployee, employee, attendanceRecords, leaveRequests]);

  return {
    user,
    monthLabel,
    records: monthlyRecords,
    presentDays,
    absentDays,
    lateDays,
    leavesTaken,
    selectedDate,
    statusFilter,
    onSelectedDate: setSelectedDate,
    onStatusFilter: setStatusFilter,
  };
}
