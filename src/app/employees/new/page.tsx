'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import PageHeader from '../../../components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EmployeeForm from '../../../components/employees/EmployeeForm';

export default function AddEmployeePage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
          <ArrowLeft size={16} /> Back to Employees
        </Link>

        <PageHeader
          title="Add New Employee"
        />

        <EmployeeForm
          currentStep={currentStep}
          onPrevious={() => setCurrentStep(s => s - 1)}
          onNext={() => setCurrentStep(s => s + 1)}
        />
      </div>
    </DashboardLayout>
  );
}
