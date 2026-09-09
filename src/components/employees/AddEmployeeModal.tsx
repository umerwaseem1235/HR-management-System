'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Trash2, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { BRANCHES, DEPARTMENTS, DESIGNATIONS, SHIFTS } from '../../lib/constants';
import { Employee } from '../../lib/types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSave?: (values: Record<string, string>) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, employee, onSave }: AddEmployeeModalProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Profile photo must be smaller than 5 MB.');
      return;
    }

    setPhotoError('');
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (employee && onSave) {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add New Employee'} size="lg">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <h4 className="text-sm font-semibold text-[#17324D] mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <span className="block text-sm font-medium text-[#263238] mb-1.5">Profile Photo</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF2F4] border border-[#D6E4E8]">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={24} className="text-[#0F8B8D]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#263238]">Upload a profile photo</p>
                  <p className="text-xs text-gray-500 mt-1">Use a clear JPG, PNG or WEBP image up to 5 MB.</p>
                  {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#D6E4E8] bg-white px-3 py-1.5 text-sm font-medium text-[#263238] hover:bg-[#EAF2F4] transition-colors">
                      <ImagePlus size={15} />
                      {photoPreview ? 'Replace Photo' : 'Choose Photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="sr-only" />
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoError('');
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Input name="firstName" label="First Name" placeholder="Enter first name" defaultValue={employee?.firstName} required />
            <Input name="lastName" label="Last Name" placeholder="Enter last name" defaultValue={employee?.lastName} required />
            <Input name="employeeCode" label="Employee ID" placeholder="EMP016" defaultValue={employee?.employeeCode} required />
            <Input name="phone" label="Phone" type="tel" placeholder="+1 (555) 000-0000" defaultValue={employee?.phone} />
            <Input name="email" label="Email" type="email" placeholder="name@company.com" defaultValue={employee?.email} required />
            <Input name="dateOfBirth" label="Date of Birth" type="date" defaultValue={employee?.dateOfBirth} />
            <Input name="address" label="Address" placeholder="Street address" defaultValue={employee?.address} className="sm:col-span-2" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#17324D] mb-3">Employment Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select name="department" label="Department" defaultValue={employee?.department} options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map(department => ({ value: department, label: department }))]} required />
            <Select name="designation" label="Designation" defaultValue={employee?.designation} options={[{ value: '', label: 'Select Designation' }, ...DESIGNATIONS.map(designation => ({ value: designation, label: designation }))]} required />
            <Select name="branch" label="Branch" defaultValue={BRANCHES.find(branch => branch.name === employee?.branch)?.id || ''} options={[{ value: '', label: 'Select Branch' }, ...BRANCHES.map(branch => ({ value: branch.id, label: `${branch.name} - ${branch.city}` }))]} required />
            <Input name="reportingManager" label="Reporting Manager" placeholder="Manager name" defaultValue={employee?.reportingManager} />
            <Select name="employmentType" label="Employment Type" defaultValue={employee?.employmentType} options={[{ value: '', label: 'Select Type' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]} required />
            <Input name="joiningDate" label="Joining Date" type="date" defaultValue={employee?.joiningDate} required />
            <Input name="probationEndDate" label="Probation End Date" type="date" defaultValue={employee?.probationEndDate} />
            <Select name="shift" label="Shift" defaultValue={employee?.shift} options={[{ value: '', label: 'Select Shift' }, ...SHIFTS.map(shift => ({ value: shift.id, label: `${shift.name} (${shift.startTime} - ${shift.endTime})` }))]} required />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#17324D] mb-3">Payroll Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="bankName" label="Bank Name" placeholder="Bank name" defaultValue={employee?.bankName} />
            <Input name="bankAccount" label="Account Number" placeholder="Account number" defaultValue={employee?.bankAccount} />
            <Input name="taxId" label="Tax ID" placeholder="Tax identification number" defaultValue={employee?.taxId} />
            <Input name="salary" label="Basic Salary" type="number" placeholder="Annual salary" defaultValue={employee?.salary} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Payroll information is restricted to authorized administrators.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit"><UserPlus size={16} /> {employee ? 'Save Changes' : 'Save Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}
