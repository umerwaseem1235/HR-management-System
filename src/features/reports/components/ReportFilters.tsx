'use client';

import { Printer, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import type { Employee } from '@/types';
import type { ReportEmployeeOption } from '@/lib/actions/reports';

interface ReportFiltersProps {
  employees: (Employee | ReportEmployeeOption)[];
  fetchLabel: string;
  draftFrom: string;
  onDraftFromChange: (v: string) => void;
  draftTo: string;
  onDraftToChange: (v: string) => void;
  isEmployee: boolean;
  empId: string;
  employeesLoading?: boolean;
  onEmpIdChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  queryPlaceholder: string;
  onFetch: () => void;
  onPrint: () => void;
}

export default function ReportFilters({
  employees, fetchLabel, draftFrom, onDraftFromChange, draftTo, onDraftToChange,
  isEmployee, empId, employeesLoading, onEmpIdChange, query, onQueryChange, queryPlaceholder,
  onFetch, onPrint,
}: ReportFiltersProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="From" type="date" value={draftFrom} onChange={(e) => onDraftFromChange(e.target.value)} />
            <Input label="To" type="date" value={draftTo} onChange={(e) => onDraftToChange(e.target.value)} />
          </div>
          {!isEmployee && (
            <div className="lg:w-48">
              <Select
                label="Employee"
                value={empId}
                onChange={(e) => { onEmpIdChange(e.target.value); }}
                options={employeesLoading
                  ? [{ value: empId, label: 'Loading…' }]
                  : employees.map((e) => ({ value: e.id, label: `${(e as Employee).firstName ?? (e as ReportEmployeeOption).firstName} ${(e as Employee).lastName ?? (e as ReportEmployeeOption).lastName}`.trim() || (e as ReportEmployeeOption).email || (e as Employee).email || e.id }))}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onFetch}>
              <Search size={16} /> {fetchLabel}
            </Button>
            <Button variant="primary" onClick={onPrint}>
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
        <SearchBar
          value={query}
          onChange={onQueryChange}
          placeholder={queryPlaceholder}
          className="w-full"
        />
      </div>
    </Card>
  );
}
