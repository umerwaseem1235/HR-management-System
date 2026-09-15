export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  currentStatus: string;
  requestedStatus: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: CorrectionStatus;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Optional' | 'Company';
}

export type SummaryMode = 'daily' | 'weekly' | 'monthly';

export interface ManualEntryValues {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string;
}

export interface AttendanceAggregate {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  totalHours: number;
}
