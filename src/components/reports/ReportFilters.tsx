'use client';

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SearchBar from '../ui/SearchBar';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Search, Printer } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import type { TabId } from './report-utils';

interface ReportFiltersProps {
  tab: TabId;
  query: string;
  onQueryChange: (v: string) => void;
  draftFrom: string;
  draftTo: string;
  onDraftFromChange: (v: string) => void;
  onDraftToChange: (v: string) => void;
  isEmployee: boolean;
  empId: string;
  onEmpIdChange: (v: string) => void;
  fetchLabel: string;
  onFetch: () => void;
  onPrint: () => void;
}

export default function ReportFilters({
  tab,
  query,
  onQueryChange,
  draftFrom,
  draftTo,
  onDraftFromChange,
  onDraftToChange,
  isEmployee,
  empId,
  onEmpIdChange,
  fetchLabel,
  onFetch,
  onPrint,
}: ReportFiltersProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <SearchBar
                value={query}
                onChange={(v) => { onQueryChange(v); }}
                placeholder={tab === 'attendance' ? 'Search date, status…' : tab === 'progress' ? 'Search project, note…' : 'Search title, status…'}
              />
            </div>
            <Input label="From" type="date" value={draftFrom} onChange={(e) => onDraftFromChange(e.target.value)} />
            <Input label="To" type="date" value={draftTo} onChange={(e) => onDraftToChange(e.target.value)} />
          </div>
          {!isEmployee && (
            <div className="lg:w-64">
              <Select
                label="Employee"
                value={empId}
                onChange={(e) => { onEmpIdChange(e.target.value); }}
                options={mockEmployees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
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
      </div>
    </Card>
  );
}
