'use client';

import { useEffect, useState } from 'react';
import { AlarmClockCheck, Save } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { getLateArrivalRule, saveLateArrivalRule } from '@/lib/actions/settings';
import { STANDARD_START, addMinutes, formatDuration } from '../utils';

export interface LateRuleState {
  graceMinutes: number;
  halfDayAfterMinutes: number;
  enabled: boolean;
}

export default function LateArrivalRules({
  rule,
  onRuleChange,
}: {
  rule: LateRuleState;
  onRuleChange: (rule: LateRuleState) => void;
}) {
  const [grace, setGrace] = useState(String(rule.graceMinutes));
  const [halfAfter, setHalfAfter] = useState(String(rule.halfDayAfterMinutes));
  const [enabled, setEnabled] = useState(rule.enabled);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const saved = await getLateArrivalRule();
        if (cancelled) return;
        setGrace(String(saved.graceMinutes));
        setHalfAfter(String(saved.halfDayAfterMinutes));
        setEnabled(saved.enabled);
        onRuleChange(saved);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load late-arrival rule.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const graceNum = parseInt(grace, 10);
  const halfNum = parseInt(halfAfter, 10);
  const valid =
    Number.isFinite(graceNum) && graceNum >= 0 && Number.isFinite(halfNum) && halfNum >= graceNum;
  const strictMode = valid && halfNum === graceNum;

  const presentUntil = addMinutes(STANDARD_START, Number.isFinite(graceNum) ? Math.max(0, graceNum) : 0);
  const halfFrom = addMinutes(STANDARD_START, Number.isFinite(halfNum) ? Math.max(0, halfNum) : 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');
    if (!valid) {
      setError('Half-day threshold cannot be less than the grace period. Set it equal to grace so even 1 minute late is Half Day.');
      return;
    }
    setSaving(true);
    try {
      const next = { graceMinutes: graceNum, halfDayAfterMinutes: halfNum, enabled };
      await saveLateArrivalRule(next);
      onRuleChange(next);
      setSavedMsg(
        next.halfDayAfterMinutes === next.graceMinutes
          ? 'Rule saved — even 1 minute late is now marked Half Day for all employees.'
          : `Rule saved — late beyond ${formatDuration(halfNum)} is now marked Half Day.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <AlarmClockCheck size={18} className="text-[#024fa7]" />
          <h3 className="text-base font-semibold text-[#17324D]">Late-Arrival Rules</h3>
        </div>
        <Badge variant={enabled ? 'success' : 'neutral'}>{enabled ? 'Active' : 'Paused'}</Badge>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Office start <span className="font-semibold text-[#263238]">{STANDARD_START}</span> · arriving
        later than the threshold below is automatically marked <span className="font-semibold">Half Day</span>.
      </p>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 rounded-lg bg-[#EAF2F4]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 rounded-lg bg-[#EAF2F4]" />
            <div className="h-10 rounded-lg bg-[#EAF2F4]" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3 cursor-pointer">
            <span className="text-sm font-medium text-[#263238]">
              Auto-mark Half Day on extreme lateness
              <span className="block text-xs font-normal text-gray-500">Applies to manual entries & edits</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#024fa7]' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Grace Period (minutes)"
              type="number"
              min="0"
              step="1"
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
              placeholder="e.g. 0"
            />
            <div>
              <Input
                label="Half Day After (minutes late)"
                type="number"
                min="0"
                step="1"
                value={halfAfter}
                onChange={(e) => setHalfAfter(e.target.value)}
                placeholder="e.g. 0"
              />
              <p className="mt-1 text-[11px] text-gray-500">Tip: set equal to grace so even 1 minute late = Half Day.</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          {savedMsg && (
            <p className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{savedMsg}</p>
          )}

          <div className="rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/60 px-4 py-3 text-xs leading-relaxed text-[#17324D]">
            <p className="font-semibold mb-1">Live preview</p>
            {enabled ? (
              strictMode ? (
                <p>
                  Up to <span className="font-semibold">{presentUntil}</span> → Present · after{' '}
                  <span className="font-semibold">{presentUntil}</span> (even 1 minute late) →{' '}
                  <span className="font-semibold text-yellow-700">Half Day</span> for all employees
                </p>
              ) : (
                <p>
                  Up to <span className="font-semibold">{presentUntil}</span> → Present ·{' '}
                  <span className="font-semibold">{presentUntil}</span>–<span className="font-semibold">{halfFrom}</span> → Late ·{' '}
                  after <span className="font-semibold">{halfFrom}</span> ({formatDuration(halfNum)} late) →{' '}
                  <span className="font-semibold text-yellow-700">Half Day</span>
                </p>
              )
            ) : (
              <p className="text-gray-500">Rule is paused — check-in times won&apos;t auto-mark Half Day.</p>
            )}
          </div>

          <Button type="submit" size="sm" disabled={saving || !valid} className="cursor-pointer">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Rule'}
          </Button>
        </form>
      )}
    </Card>
  );
}
