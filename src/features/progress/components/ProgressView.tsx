'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchBar from '@/components/ui/SearchBar';
import { Plus } from 'lucide-react';
import ProgressList from './ProgressList';
import ProgressModal from './ProgressModal';
import { useProgressView } from '../hooks/useProgressView';

export default function ProgressView() {
  const v = useProgressView();

  if (!v.user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={v.isEmployee ? 'My Progress' : 'Employee Progress'}
        actions={
          v.isEmployee ? (
            <Button variant="primary" onClick={v.openAdd}>
              <Plus size={16} /> Add Progress
            </Button>
          ) : undefined
        }
      />

      <Card padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchBar
            value={v.query}
            onChange={(val) => { v.setQuery(val); v.setPage(1); }}
            placeholder={v.isEmployee ? 'Search by project name…' : 'Search by employee, project name…'}
            className="flex-1"
          />
          <div className="grid grid-cols-2 gap-3 lg:w-auto">
            <Input
              type="date"
              aria-label="From date"
              value={v.fromDate}
              onChange={(e) => { v.setFromDate(e.target.value); v.setPage(1); }}
            />
            <Input
              type="date"
              aria-label="To date"
              value={v.toDate}
              onChange={(e) => { v.setToDate(e.target.value); v.setPage(1); }}
            />
          </div>
        </div>
      </Card>

      <ProgressList
        pageRows={v.pageRows}
        safePage={v.safePage}
        pageSize={v.pageSize}
        totalPages={v.totalPages}
        start={v.start}
        end={v.end}
        filteredCount={v.filtered.length}
        query={v.query}
        fromDate={v.fromDate}
        toDate={v.toDate}
        isEmployee={v.isEmployee}
        onView={v.setViewing}
        onEdit={v.openEdit}
        onDelete={v.setConfirmDeleteEntry}
        onPageChange={v.setPage}
        onPageSizeChange={(n) => { v.setPageSize(n); v.setPage(1); }}
      />

      <ProgressModal
        showFormModal={v.showFormModal}
        editingId={v.editingId}
        projectName={v.projectName}
        onProjectNameChange={v.setProjectName}
        submissionDate={v.submissionDate}
        onSubmissionDateChange={v.setSubmissionDate}
        description={v.description}
        onDescriptionChange={(html) => { v.setDescription(html); v.clearDescriptionError(); }}
        formErrors={v.formErrors}
        projectNames={v.projectNames}
        stats={v.stats}
        onCloseForm={v.closeForm}
        onSubmit={v.handleSubmit}
        viewing={v.viewing}
        onCloseViewing={() => v.setViewing(null)}
        confirmDeleteEntry={v.confirmDeleteEntry}
        onCloseDeleteConfirm={() => v.setConfirmDeleteEntry(null)}
        onConfirmDelete={v.confirmDelete}
      />
    </div>
  );
}
