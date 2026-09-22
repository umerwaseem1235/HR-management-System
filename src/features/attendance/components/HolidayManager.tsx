'use client';

import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Holiday } from '../types';

export default function HolidayManager({
  holidays,
  holidayMsg,
  onAddHoliday,
  onDelete,
}: {
  holidays: Holiday[];
  holidayMsg: string;
  onAddHoliday: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (holiday: Holiday) => void;
}) {
  return (
    <div className="w-full">
      {/* Holiday configuration */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#024fa7]" />
            <h3 className="text-base font-semibold text-[#17324D]">Holiday Configuration</h3>
          </div>
          <Badge variant="default">{holidays.length} Holidays</Badge>
        </div>

        <form onSubmit={onAddHoliday} className="mb-4 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input name="holidayName" label="Holiday Name" placeholder="e.g. Independence Day" required />
            <Input name="holidayDate" label="Date" type="date" required />
            <Select
              name="holidayType"
              label="Type"
              defaultValue="Public"
              options={[
                { value: 'Public', label: 'Public' },
                { value: 'Optional', label: 'Optional' },
                { value: 'Company', label: 'Company' },
              ]}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#263238]">
              <input
                type="checkbox"
                name="holidayRecurring"
                defaultChecked
                className="h-4 w-4 rounded border-[#D6E4E8] accent-[#024fa7]"
              />
              Recurring every year
            </label>
            <Button type="submit" size="sm" className="cursor-pointer">
              <Plus size={15} /> Add Holiday
            </Button>
          </div>
          {holidayMsg && (
            <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{holidayMsg}</p>
          )}

        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Holiday</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E4E8]">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-4 py-3 text-sm font-medium text-[#263238]">{h.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{h.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant={h.type === 'Public' ? 'info' : h.type === 'Company' ? 'success' : 'neutral'}>{h.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(h)}
                      title="Delete holiday"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
