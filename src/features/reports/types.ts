export interface AttendanceDayRow {
  date: string;
  weekday: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  employeeAvatar?: string;
  hours: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Absent' | 'Holiday' | 'Weekend';
}

export type TabId = 'attendance' | 'progress' | 'task';

export interface ViewNote {
  project: string;
  date: string;
  html: string;
}
