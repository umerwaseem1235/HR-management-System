'use client';

import { EmployeeFormModal, useEmployeeCreate } from '@/features/employees';

export default function AddEmployeePage() {
  const { close, lookupData, isLookupLoading, isSubmitting, submitError, handleSave } =
    useEmployeeCreate();

  return (
    <EmployeeFormModal
      isOpen
      onClose={close}
      onSave={handleSave}
      lookupData={lookupData}
      isLookupLoading={isLookupLoading}
      isSubmitting={isSubmitting}
      isCreatingAccount
      submitError={submitError}
    />
  );
}
