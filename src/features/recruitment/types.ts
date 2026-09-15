import type { Candidate } from '@/types';

export const SOURCES = ['Referral', 'Walk-in', 'Internal', 'Other'];
export const STAGES: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];
export const INTERVIEW_MODES = ['In-person', 'Phone'];

export interface HistoryItem { date: string; action: string; note?: string; }
export interface Interview { id: string; candidateId: string; date: string; time: string; mode: string; interviewer: string; interviewerId?: string; round: string; status: 'Scheduled' | 'Completed' | 'Cancelled'; feedback?: string; rating?: number; }
export interface Offer { id: string; candidateId: string; salary: number; joiningDate: string; status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'; notes?: string; }

export type CandidateExt = Candidate & { source?: string; history: HistoryItem[]; };

export const today = () => new Date().toISOString().slice(0, 10);
