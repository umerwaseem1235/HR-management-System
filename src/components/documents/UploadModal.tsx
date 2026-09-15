'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Upload, Paperclip, X } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';

interface UploadModalProps {
  isOpen: boolean;
  docName: string;
  docEmployee: string;
  docType: string;
  docExpiry: string;
  docFile: string;
  docError: string;
  onDocNameChange: (value: string) => void;
  onDocEmployeeChange: (value: string) => void;
  onDocTypeChange: (value: string) => void;
  onDocExpiryChange: (value: string) => void;
  onFilePick: (file: File | undefined) => void;
  onClearFile: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function UploadModal({
  isOpen,
  docName,
  docEmployee,
  docType,
  docExpiry,
  docFile,
  docError,
  onDocNameChange,
  onDocEmployeeChange,
  onDocTypeChange,
  onDocExpiryChange,
  onFilePick,
  onClearFile,
  onClose,
  onSubmit,
}: UploadModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Document Name" placeholder="e.g. Employment Contract" value={docName} onChange={e => onDocNameChange(e.target.value)} required />
        <Select label="Employee" value={docEmployee} onChange={e => onDocEmployeeChange(e.target.value)}
          options={[{ value: '', label: 'Select employee…' }, { value: 'All Employees', label: 'All Employees' }, ...mockEmployees.map(e => ({ value: `${e.firstName} ${e.lastName}`, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Document Type" value={docType} onChange={e => onDocTypeChange(e.target.value)}
            options={['Contract', 'ID', 'Legal', 'Policy', 'Certificate'].map(t => ({ value: t, label: t }))} required />
          <Input label="Expiry Date (optional)" type="date" value={docExpiry} onChange={e => onDocExpiryChange(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Attach Document</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3 hover:border-[#024fa7] hover:bg-[#EAF2F4]/50 transition-colors">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2F4] text-[#024fa7]"><Upload size={17} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[#263238] truncate">{docFile || 'Choose file'}</span>
              <span className="block text-xs text-gray-500 mt-0.5">PDF, DOC, JPG or PNG up to 10 MB</span>
            </span>
            {docFile && <button type="button" title="Remove file" onClick={e => { e.preventDefault(); onClearFile(); }} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><X size={14} /></button>}
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only"
              onChange={e => onFilePick(e.target.files?.[0])} />
          </label>
          {docFile && <p className="mt-2 flex items-center gap-2 text-xs text-gray-600 rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-3 py-2"><Paperclip size={12} className="text-[#024fa7]" /><span className="truncate flex-1">{docFile}</span></p>}
        </div>
        {docError && <p className="text-sm text-red-500">{docError}</p>}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit"><Upload size={16} /> Upload</Button>
        </div>
      </form>
    </Modal>
  );
}
