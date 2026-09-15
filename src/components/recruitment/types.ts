import type { Candidate, Job } from '../../lib/types';

export interface HistoryItem { date: string; action: string; note?: string; }
export interface Interview {
  id: string; candidateId: string; date: string; time: string; mode: string;
  interviewer: string; interviewerId?: string; round: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled'; feedback?: string; rating?: number;
}
export interface Offer {
  id: string; candidateId: string; salary: number; joiningDate: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'; notes?: string;
}

export type CandidateExt = Candidate & { source?: string; history: HistoryItem[] };

export interface JobModalState {
  id?: string; title: string; department: string; branch: string;
  vacancies: string; requirements: string; description: string;
  closingDate: string; status: Job['status'];
}
export interface IntModalState { candidateId: string; date: string; time: string; mode: string; interviewer: string; round: string; }
export interface FbModalState { id: string; feedback: string; rating: string; }
export interface OfferModalState { candidateId: string; salary: string; joiningDate: string; notes: string; }
export interface ConvertModalState {
  candidateId: string; code: string; department: string; designation: string;
  branch: string; joiningDate: string; salary: string;
}
