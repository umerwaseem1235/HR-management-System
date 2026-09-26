'use client';

import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import HolidayManager from '@/features/attendance/components/HolidayManager';
import { useHolidays } from '../hooks/useHolidays';

export default function HolidaysView() {
  const h = useHolidays();

  if (!h.user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Holidays" />

      {h.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {h.error}
        </div>
      )}

      {h.loading ? (
        <div className="rounded-xl border border-[#D6E4E8] bg-white p-6 text-sm text-gray-500">
          Loading holidays…
        </div>
      ) : (
        <HolidayManager
          holidays={h.holidays}
          holidayMsg={h.holidayMsg}
          onAddHoliday={h.handleAddHoliday}
          onDelete={h.setConfirmDeleteHoliday}
          readOnly={!h.isAdmin}
        />
      )}

      <ConfirmDialog
        isOpen={!!h.confirmDeleteHoliday}
        onClose={() => h.setConfirmDeleteHoliday(null)}
        title="Delete Holiday?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{h.confirmDeleteHoliday?.name}</span>?
          </>
        }
        subline={h.confirmDeleteHoliday ? `${h.confirmDeleteHoliday.date} · ${h.confirmDeleteHoliday.type} holiday` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The holiday will be permanently removed from the calendar.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => { if (h.confirmDeleteHoliday) { h.handleDeleteHoliday(h.confirmDeleteHoliday.id); h.setConfirmDeleteHoliday(null); } }}
      />
    </div>
  );
}
