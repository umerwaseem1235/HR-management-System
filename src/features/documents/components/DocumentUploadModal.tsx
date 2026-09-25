'use client';

import React from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Upload, FileText, Download, Paperclip, X } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { DocumentItem } from '../types';

interface DocumentUploadModalProps {
  showUpload: boolean;
  onCloseUpload: () => void;
  onUpload: (e: React.FormEvent) => void;
  docName: string;
  onDocNameChange: (value: string) => void;
  docEmployee: string;
  onDocEmployeeChange: (value: string) => void;
  docType: string;
  onDocTypeChange: (value: string) => void;
  docExpiry: string;
  onDocExpiryChange: (value: string) => void;
  docFile: string;
  docError: string;
  isUploading?: boolean;
  onFilePick: (file: File | undefined) => void;
  onRemoveFile: () => void;
  viewDoc: DocumentItem | null;
  onCloseView: () => void;
  onDownload: (doc: DocumentItem) => void;
}

export default function DocumentUploadModal(props: DocumentUploadModalProps) {
  const {
    showUpload, onCloseUpload, onUpload,
    docName, onDocNameChange,
    docEmployee, onDocEmployeeChange,
    docType, onDocTypeChange,
    docExpiry, onDocExpiryChange,
    docFile, docError, isUploading, onFilePick, onRemoveFile,
    viewDoc, onCloseView, onDownload,
  } = props;
  const { employees } = useEmployeeDirectory();

  return (
    <>
      <Modal isOpen={showUpload} onClose={onCloseUpload} title="Upload Document" size="sm">
        <form onSubmit={onUpload} className="space-y-4">
          <Input label="Document Name" placeholder="e.g. Employment Contract" value={docName} onChange={e => onDocNameChange(e.target.value)} required />
          <Select label="Employee" value={docEmployee} onChange={e => onDocEmployeeChange(e.target.value)}
            options={[{ value: '', label: 'Select employee…' }, { value: 'All Employees', label: 'All Employees' }, ...employees.map(e => ({ value: `${e.firstName} ${e.lastName}`, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} required />
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
              {docFile && <button type="button" title="Remove file" onClick={e => { e.preventDefault(); onRemoveFile(); }} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><X size={14} /></button>}
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only"
                onChange={e => onFilePick(e.target.files?.[0])} />
            </label>
            {docFile && <p className="mt-2 flex items-center gap-2 text-xs text-gray-600 rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-3 py-2"><Paperclip size={12} className="text-[#024fa7]" /><span className="truncate flex-1">{docFile}</span></p>}
          </div>
          {docError && <p className="text-sm text-red-500">{docError}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={onCloseUpload}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isUploading} loading={isUploading}><Upload size={16} /> {isUploading ? 'Uploading…' : 'Upload'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewDoc} onClose={onCloseView} title="Document Details" size="lg">
        {viewDoc && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#EAF2F4] p-3 rounded-lg"><FileText size={24} className="text-[#024fa7]" /></div>
              <div className="flex-1">
                <p className="text-base font-semibold text-[#17324D]">{viewDoc.name}</p>
                <p className="text-xs text-gray-500">{viewDoc.employee} · {viewDoc.type} · Uploaded {viewDoc.uploadedDate}{viewDoc.expiryDate ? ` · Expires ${viewDoc.expiryDate}` : ''}</p>
              </div>
              <Badge variant={viewDoc.status === 'Active' ? 'success' : 'warning'} size="sm">{viewDoc.status}</Badge>
            </div>
            <div className="overflow-auto max-h-[55vh] rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 min-h-[200px] flex items-center justify-center p-3">
              {viewDoc.fileData ? (
                viewDoc.fileData.startsWith('data:image/') ? (
                  <Image
                    src={viewDoc.fileData}
                    alt={viewDoc.name}
                    width={800}
                    height={600}
                    unoptimized
                    loader={({ src }) => src}
                    className="max-h-[50vh] w-auto rounded-lg mx-auto"
                  />
                ) : viewDoc.fileData.startsWith('data:application/pdf') ? (
                  <iframe src={viewDoc.fileData} title={viewDoc.name} className="w-full h-[50vh] rounded-lg bg-white" />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm font-medium text-[#17324D]">{viewDoc.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">Preview not available — use Download.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-white border border-[#D6E4E8] w-fit"><FileText size={20} className="text-gray-400" /></div>
                  <p className="text-sm font-medium text-[#17324D]">No file attached</p>
                  <p className="text-xs text-gray-500">Older record — details above. Download gives info file.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCloseView}>Close</Button>
              <Button variant="primary" onClick={() => onDownload(viewDoc)}><Download size={16} /> Download</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
