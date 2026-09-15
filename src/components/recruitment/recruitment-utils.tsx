import Badge from '../ui/Badge';
import type { Candidate } from '../../lib/types';

export const SOURCES = ['Referral', 'Walk-in', 'Internal', 'Other'];
export const STAGES: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];
export const INTERVIEW_MODES = ['In-person', 'Phone'];

export const today = () => new Date().toISOString().slice(0, 10);

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    Applied: 'info', Screening: 'warning', Interview: 'warning', Selected: 'success', Rejected: 'danger', Offer: 'success', Hired: 'success',
  };
  return <Badge variant={map[stage] || 'neutral'}>{stage}</Badge>;
}
