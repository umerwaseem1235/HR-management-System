import type { Candidate } from '@/types';

// Constants + helpers now live in ./constants and ./utils — re-exported here
// so existing `from '@/features/recruitment/types'` imports keep working.
export { SOURCES, STAGES, INTERVIEW_MODES } from './constants';
export { today, cvDisplayName } from './utils';

export interface HistoryItem { date: string; action: string; note?: string; }
export interface Interview { id: string; candidateId: string; date: string; time: string; mode: string; interviewer: string; interviewerId?: string; round: string; status: 'Scheduled' | 'Completed' | 'Cancelled'; }
export interface Offer { id: string; candidateId: string; salary: number; joiningDate: string; status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'; notes?: string; }

export type CandidateExt = Candidate & { source?: string; history: HistoryItem[]; };
