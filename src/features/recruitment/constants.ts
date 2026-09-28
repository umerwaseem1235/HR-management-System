import type { Candidate } from '@/types';

export const SOURCES = ['Referral', 'Walk-in', 'Internal', 'Other'];
export const STAGES: Candidate['stage'][] = [
  'Applied',
  'Screening',
  'Interview',
  'Selected',
  'Offer',
  'Hired',
  'Rejected',
];
export const INTERVIEW_MODES = ['In-person', 'Phone'];
