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
}
