'use client';

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
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Optional' | 'Company';
  isRecurring: boolean;
}

export interface CorrectionHistoryEntry {
  id: string;
  correctedBy: string;
  employeeName: string;
  date: string;
  action: 'Manual Correction' | 'Correction Approved';
  previousValue: string;
  newValue: string;
  timestamp: string;
}
