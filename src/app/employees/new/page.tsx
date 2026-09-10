'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { ArrowLeft, ArrowRight, Save, User, Briefcase, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { DEPARTMENTS, DESIGNATIONS, BRANCHES, SHIFTS } from '../../../lib/constants';

const steps = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Payroll', icon: CreditCard },
];

export default function AddEmployeePage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-[#0F8B8D] hover:underline">
          <ArrowLeft size={16} /> Back to Employees
        </Link>

        <PageHeader
          eyebrow="Workforce"
          title="Add New Employee"
          subtitle="Complete the steps below to onboard a new team member"
        />

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.id ? 'bg-[#0F8B8D] text-white' : 'bg-[#D6E4E8] text-gray-500'
                }`}>
                  {step.id}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${currentStep >= step.id ? 'text-[#17324D]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-[#0F8B8D]' : 'bg-[#D6E4E8]'}`} />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#17324D]">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="Enter first name" required />
                <Input label="Last Name" placeholder="Enter last name" required />
                <Input label="Email" type="email" placeholder="email@company.com" required />
                <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
                <Input label="Date of Birth" type="date" />
                <Select label="Gender" options={[{ value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
                <Input label="Address" placeholder="Street address" className="sm:col-span-2" />
                <Input label="City" placeholder="City" />
                <Input label="Country" placeholder="Country" />
              </div>
              <h3 className="text-base font-semibold text-[#17324D] mt-6">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Contact Name" placeholder="Emergency contact name" />
                <Input label="Contact Phone" type="tel" placeholder="Phone number" />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#17324D]">Employment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Employee Code" placeholder="EMP016" />
                <Select label="Department" options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} />
                <Select label="Designation" options={[{ value: '', label: 'Select Designation' }, ...DESIGNATIONS.map(d => ({ value: d, label: d }))]} />
                <Select label="Branch" options={[{ value: '', label: 'Select Branch' }, ...BRANCHES.map(b => ({ value: b.id, label: `${b.name} - ${b.city}` }))]} />
                <Input label="Reporting Manager" placeholder="Manager name" />
                <Select label="Employment Type" options={[{ value: '', label: 'Select Type' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]} />
                <Input label="Joining Date" type="date" />
                <Select label="Shift" options={[{ value: '', label: 'Select Shift' }, ...SHIFTS.map(s => ({ value: s.id, label: `${s.name} (${s.startTime} - ${s.endTime})` }))]} />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#17324D]">Payroll Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Bank Name" placeholder="Bank name" />
                <Input label="Account Number" placeholder="Account number" />
                <Input label="Tax ID" placeholder="Tax identification number" />
                <Input label="Basic Salary" type="number" placeholder="Annual salary" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#D6E4E8]">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => s - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={16} /> Previous
            </Button>
            {currentStep < 3 ? (
              <Button variant="primary" onClick={() => setCurrentStep(s => s + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="primary">
                <Save size={16} /> Save Employee
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
