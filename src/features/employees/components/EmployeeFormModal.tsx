'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Trash2, UserPlus, Loader2, Eye, EyeOff, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { Employee } from '@/lib/types';

interface LookupItem {
  id: string;
  name: string;
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSave?: (values: Record<string, string>, photo: string | null) => void | Promise<void>;
  submitError?: string | null;
  lookupData?: {
    departments: LookupItem[];
    designations: LookupItem[];
    branches: LookupItem[];
    shifts: LookupItem[];
    managers: LookupItem[];
  } | null;
  isLookupLoading?: boolean;
  isSubmitting?: boolean;
  isCreatingAccount?: boolean;
}

export default function EmployeeFormModal({
  isOpen,
  onClose,
  employee,
  onSave,
  lookupData,
  isLookupLoading,
  isSubmitting,
  isCreatingAccount = false,
  submitError,
}: EmployeeFormModalProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loginTouched, setLoginTouched] = useState(false);

  useEffect(() => {
    const avatar = employee?.avatar;
    const isImageUrl = (url: string) => {
      const regex = new RegExp('^(https?:\\/\\/|blob:|data:image\\/|\\/)');
      return regex.test(url);
    };
    if (isOpen && avatar && isImageUrl(avatar)) {
      setTimeout(() => setPhotoPreview(avatar), 0);
    } else if (isOpen && !employee) {
      setTimeout(() => setPhotoPreview(null), 0);
    }
    setTimeout(() => setPhotoError(''), 0);
    if (isOpen) setLoginTouched(false);
  }, [isOpen, employee?.avatar]);

  // Keep Login Email in sync with the employee email until the admin
  // types a custom login email (typical case: both are identical).
  const syncLoginEmail = (employeeEmail: string, form: HTMLFormElement | null) => {
    if (loginTouched || !form) return;
    const loginInput = form.querySelector('input[name="loginEmail"]') as HTMLInputElement | null;
    if (loginInput) loginInput.value = employeeEmail;
  };

  // Downscale uploads to a 256px JPEG (~20–50KB). Raw phone photos stored
  // as base64 data URLs weighed megabytes per row and made the employee
  // list take over a minute to load — this keeps that from ever recurring.
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read the selected image.'));
      };
      img.src = objectUrl;
    });

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      setPhotoPreview(await compressImage(file));
    } catch {
      setPhotoError('Could not read the selected image.');
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const handlePasswordChange = (password: string) => {
    setPasswordStrength(calculatePasswordStrength(password));
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (confirmPassword: string, password: string) => {
    setConfirmError(confirmPassword && confirmPassword !== password ? 'Passwords do not match' : '');
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const stringValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, String(value)])
    ) as Record<string, string>;

    // Validate account credentials if creating new account
    if (isCreatingAccount) {
      const password = stringValues.password;
      const confirmPassword = stringValues.confirmPassword;
      const loginEmail = stringValues.loginEmail;

      if (!loginEmail?.trim()) {
        setFormError('Login email is required.');
        return;
      }
      if (!password) {
        setFormError('Temporary password is required.');
        return;
      }
      if (password.length < 8) {
        setFormError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }

    // Only close on success — a throwing onSave keeps the form open
    // so the error stays visible instead of data silently vanishing.
    try {
      if (onSave) await onSave(stringValues, photoPreview);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save employee.');
    }
  };

  const getDefaultValue = (field: keyof Employee) => employee?.[field] ?? '';

  const disabled = isLookupLoading || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add New Employee'} size="lg">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {(formError || submitError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            {formError || submitError}
          </div>
        )}
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
                    <ImagePlus size={24} className="text-[#024fa7]" />
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
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="sr-only" disabled={disabled} />
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoError('');
                        }}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Input name="firstName" label="First Name" placeholder="Enter first name" defaultValue={getDefaultValue('firstName')} required disabled={disabled} />
            <Input name="lastName" label="Last Name" placeholder="Enter last name" defaultValue={getDefaultValue('lastName')} required disabled={disabled} />
            <Input name="employeeCode" label="Employee ID" placeholder="Auto-generated if empty" defaultValue={getDefaultValue('employeeCode')} disabled={disabled} />
            <Input name="phone" label="Phone" type="tel" placeholder="+1 (555) 000-0000" defaultValue={getDefaultValue('phone')} disabled={disabled} />
            <Input name="email" label="Email" type="email" placeholder="name@company.com" defaultValue={getDefaultValue('email')} required disabled={disabled} onChange={(e) => syncLoginEmail(e.target.value, e.target.form)} />
            <Input name="dateOfBirth" label="Date of Birth" type="date" defaultValue={getDefaultValue('dateOfBirth')} disabled={disabled} />
            <Input name="address" label="Address" placeholder="Street address" defaultValue={getDefaultValue('address')} className="sm:col-span-2" disabled={disabled} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#17324D] mb-3">Employment Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              name="departmentId"
              label="Department"
              defaultValue={employee?.departmentId || ''}
              options={[{ value: '', label: isLookupLoading ? 'Loading departments...' : 'Select Department' }, ...(lookupData?.departments || []).map(d => ({ value: d.id, label: d.name }))]}
              required
              disabled={disabled}
            />
            <Select
              name="designationId"
              label="Designation"
              defaultValue={employee?.designationId || ''}
              options={[{ value: '', label: isLookupLoading ? 'Loading designations...' : 'Select Designation' }, ...(lookupData?.designations || []).map(d => ({ value: d.id, label: d.name }))]}
              required
              disabled={disabled}
            />
            <Select
              name="branchId"
              label="Branch"
              defaultValue={employee?.branchId || ''}
              options={[{ value: '', label: isLookupLoading ? 'Loading branches...' : 'Select Branch' }, ...(lookupData?.branches || []).map(b => ({ value: b.id, label: b.name }))]}
              required
              disabled={disabled}
            />
            <Select
              name="reportingManagerId"
              label="Reporting Manager"
              defaultValue={employee?.reportingManagerId || ''}
              options={[{ value: '', label: isLookupLoading ? 'Loading managers...' : 'No Manager' }, ...(lookupData?.managers || []).map(m => ({ value: m.id, label: m.name }))]}
              disabled={disabled}
            />
            <Select
              name="employmentType"
              label="Employment Type"
              defaultValue={getDefaultValue('employmentType')}
              options={[{ value: '', label: 'Select Type' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]}
              required
              disabled={disabled}
            />
            <Input name="joiningDate" label="Joining Date" type="date" defaultValue={getDefaultValue('joiningDate')} required disabled={disabled} />
            <Input name="probationEndDate" label="Probation End Date" type="date" defaultValue={getDefaultValue('probationEndDate')} disabled={disabled} />
            <Select
              name="shiftId"
              label="Shift"
              defaultValue={employee?.shiftId || ''}
              options={[{ value: '', label: isLookupLoading ? 'Loading shifts...' : 'Select Shift' }, ...(lookupData?.shifts || []).map(s => ({ value: s.id, label: s.name }))]}
              required
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#17324D] mb-3">Payroll Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="bankName" label="Bank Name" placeholder="Bank name" defaultValue={getDefaultValue('bankName')} disabled={disabled} />
            <Input name="bankAccount" label="Account Number" placeholder="Account number" defaultValue={getDefaultValue('bankAccount')} disabled={disabled} />
            <Input name="taxId" label="Tax ID" placeholder="Tax identification number" defaultValue={getDefaultValue('taxId')} disabled={disabled} />
            <Input name="salary" label="Basic Salary" type="number" placeholder="Annual salary" defaultValue={getDefaultValue('salary')} disabled={disabled} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Payroll information is restricted to authorized administrators.</p>
        </div>

        {isCreatingAccount && (
          <div>
            <h4 className="text-sm font-semibold text-[#17324D] mb-3">Account Credentials</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="loginEmail"
                label="Login Email"
                type="email"
                placeholder="login@company.com"
                defaultValue={getDefaultValue('email')}
                required
                disabled={disabled}
                onChange={() => setLoginTouched(true)}
              />
              <div className="relative">
                <label className="block text-sm font-medium text-[#263238] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter password (min. 8 characters)"
                    required
                    disabled={disabled}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#024fa7]"
                    disabled={disabled}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-[#263238] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    required
                    disabled={disabled}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value, ((e.target.closest('form') as HTMLFormElement | null)?.querySelector('input[name="password"]') as HTMLInputElement | null)?.value || '')}
                    className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#024fa7]"
                    disabled={disabled}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmError && <p className="text-xs text-red-600 mt-1">{confirmError}</p>}
              </div>
              <div className="sm:col-span-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Password Strength</span>
                    <span className={`font-medium ${
                      passwordStrength === 0 ? 'text-gray-400' :
                      passwordStrength <= 1 ? 'text-red-500' :
                      passwordStrength <= 2 ? 'text-amber-500' :
                      passwordStrength === 3 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                    {passwordStrength === 0 ? 'Very Weak' :
                     passwordStrength === 1 ? 'Weak' :
                     passwordStrength === 2 ? 'Fair' :
                     passwordStrength === 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength === 0 ? 'bg-gray-200 w-0' :
                      passwordStrength === 1 ? 'bg-red-500 w-1/4' :
                      passwordStrength === 2 ? 'bg-amber-500 w-2/4' :
                      passwordStrength === 3 ? 'bg-yellow-500 w-3/4' : 'bg-green-500 w-full'
                    }`}
                    style={{ width: `${passwordStrength * 25}%` }}
                  />
                </div>
                {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
              </div>
            </div>
          </div>
        </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button type="button" variant="outline" onClick={onClose} disabled={disabled}>Cancel</Button>
          <Button type="submit" disabled={disabled} loading={isSubmitting}>
            <UserPlus size={16} /> {employee ? 'Save Changes' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}