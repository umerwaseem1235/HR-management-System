'use client';

import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Holiday } from '../types';

export default function HolidayManager({
  holidays,
  holidayMsg,
  onAddHoliday,
  onDelete,
  readOnly = false,
}: {
  holidays: Holiday[];
  holidayMsg: string;
  onAddHoliday: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (holiday: Holiday) => void;
  /** When true, hides the add form and delete buttons (non-admin view). */
  readOnly?: boolean;
}) {
  return (
    <div className="w-full min-w-0">
      {/* Holiday configuration */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-teal" />
            <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Holiday Configuration</h3>
          </div>
          <Badge variant="default">{holidays.length} Holidays</Badge>
        </div>

        <form onSubmit={onAddHoliday} className={`mb-4 rounded-lg border border-dashed border-medium-gray bg-blue-gray-light p-4 ${readOnly ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input name="holidayName" label="Holiday Name" placeholder="e.g. Independence Day" required />
            <DatePicker name="holidayDate" label="Date" required />
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
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-dark-text dark:text-gray-100">
              <input
                type="checkbox"
                name="holidayRecurring"
                defaultChecked
                className="h-4 w-4 rounded border-medium-gray accent-teal"
              />
              Recurring every year
            </label>
            <Button type="submit" size="sm" className="cursor-pointer">
              <Plus size={15} /> Add Holiday
            </Button>
          </div>
          {holidayMsg && (
            <p className="mt-3 rounded-lg border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400">{holidayMsg}</p>
          )}

        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-gray border-b border-medium-gray">
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Holiday</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Type</th>
                {!readOnly && <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-medium-gray">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                  <td className="px-4 py-3 text-sm font-medium text-dark-text dark:text-gray-100">{h.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{h.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant={h.type === 'Public' ? 'info' : h.type === 'Company' ? 'success' : 'neutral'}>{h.type}</Badge>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(h)}
                        title="Delete holiday"
                        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
