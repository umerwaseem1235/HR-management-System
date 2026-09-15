import type { AttendanceRecord } from '@/types';
import { timeToMinutes } from '@/utils/date';

export const STANDARD_START = '09:00';
export const STANDARD_END = '18:00';
export const STANDARD_GRACE_MINUTES = 15;

export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
];

export const ADMIN_STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Weekend', label: 'Weekend' },
];

// Build a deterministic working-day schedule for the current month so the
// employee view has meaningful monthly stats even when mock data has no
// records in the current month. Real mock records for the month take precedence.
export function buildMonthlySchedule(
  employeeId: string,
  employeeName: string,
  year: number,
  month: number,
): AttendanceRecord[] {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const seed = employeeId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const records: AttendanceRecord[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue; // skip weekends

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const r = (day * 13 + seed) % 20;
    const getStatus = (): AttendanceRecord['status'] => {
      if (r === 0) return 'Absent';
      if (r <= 2) return 'Late';
      if (r === 3) return 'Leave';
      return 'Present';
    };
    const status = getStatus();

    const workHours = status === 'Present' ? 8 + ((day + seed) % 12) / 10 : status === 'Late' ? 8.5 : status === 'Half Day' ? 4 : 0;

    records.push({
      id: `gen-${employeeId}-${dateStr}`,
      employeeId,
      employeeName,
      date: dateStr,
      checkIn: status === 'Present' ? '09:00' : status === 'Late' ? '09:35' : status === 'Half Day' ? '09:00' : '',
      checkOut: status === 'Present' || status === 'Late' ? '18:00' : status === 'Half Day' ? '13:00' : '',
      status,
      workHours: Math.round(workHours * 10) / 10,
      overtime: status === 'Present' && (day + seed) % 5 === 0 ? 0.5 : 0,
    });
  }
  return records;
}

export interface AttendanceAggregate {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  totalHours: number;
}

export function aggregate(records: AttendanceRecord[]): AttendanceAggregate {
  const present = records.filter((r) => r.status === 'Present').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const halfDay = records.filter((r) => r.status === 'Half Day').length;
  const leave = records.filter((r) => r.status === 'Leave').length;
  const totalHours = records.reduce((s, r) => s + (r.workHours || 0), 0);
  return { present, absent, late, halfDay, leave, totalHours };
}

export function calcWorkHours(checkIn: string, checkOut: string, status: string): number {
  const inMin = checkIn ? timeToMinutes(checkIn) : 0;
  const outMin = checkOut ? timeToMinutes(checkOut) : 0;
  if (inMin && outMin && outMin > inMin) return Math.round(((outMin - inMin) / 60) * 10) / 10;
  if (status === 'Present' || status === 'Late') return 8;
  if (status === 'Half Day') return 4;
  return 0;
}

export function lateBy(rec: AttendanceRecord): number {
  if (!rec.checkIn) return 0;
  const diff = timeToMinutes(rec.checkIn) - (timeToMinutes(STANDARD_START) + STANDARD_GRACE_MINUTES);
  return diff > 0 ? diff : 0;
}

export function earlyLeave(rec: AttendanceRecord): number {
  if (!rec.checkIn || !rec.checkOut) return 0;
  const diff = timeToMinutes(STANDARD_END) - timeToMinutes(rec.checkOut);
  return diff > 0 ? diff : 0;
}
