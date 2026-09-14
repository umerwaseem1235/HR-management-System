'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Upload, FileText, File, FolderOpen, Download, Eye, Clock, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockEmployees } from '../../lib/mock-data';

const mockDocuments = [
  { id: '1', name: 'Employment Contract', type: 'Contract', employee: 'Michael Chen', uploadedDate: '2022-03-01', expiryDate: null, status: 'Active' },
  { id: '2', name: 'NDA Agreement', type: 'Legal', employee: 'All Employees', uploadedDate: '2024-01-01', expiryDate: '2025-01-01', status: 'Active' },
  { id: '3', name: 'Health Insurance Card', type: 'ID', employee: 'Sarah Williams', uploadedDate: '2023-06-15', expiryDate: '2024-06-15', status: 'Expiring Soon' },
  { id: '4', name: 'Driving License', type: 'ID', employee: 'James Anderson', uploadedDate: '2023-01-10', expiryDate: '2026-01-10', status: 'Active' },
  { id: '5', name: 'Company Policy Handbook', type: 'Policy', employee: 'All Employees', uploadedDate: '2024-01-01', expiryDate: null, status: 'Active' },
  { id: '6', name: 'Work Permit', type: 'ID', employee: 'Priya Sharma', uploadedDate: '2023-02-01', expiryDate: '2024-02-15', status: 'Expiring Soon' },
];

const categories = ['All', 'Contract', 'ID', 'Legal', 'Policy', 'Certificate'];

export default function DocumentsPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [docs, setDocs] = useState<(typeof mockDocuments[number] & { fileData?: string; fileName?: string })[]>(mockDocuments);
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<(typeof docs[number]) | null>(null);
  const [docName, setDocName] = useState('');
  const [docEmployee, setDocEmployee] = useState('');
  const [docType, setDocType] = useState('Contract');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docFileData, setDocFileData] = useState('');
  const [docError, setDocError] = useState('');

  const filtered = docs.filter(doc => {
    const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.employee.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || doc.type === category;
    return matchSearch && matchCat;
  });

  const resetUpload = () => {
    setDocName(''); setDocEmployee(''); setDocType('Contract'); setDocExpiry(''); setDocFile(''); setDocFileData(''); setDocError('');
  };

  const handleFilePick = (file: File | undefined) => {
    if (!file) { setDocFile(''); setDocFileData(''); return; }
    if (file.size > 10 * 1024 * 1024) { setDocError('File must be smaller than 10MB.'); return; }
    setDocError('');
    setDocFile(file.name);
    const reader = new FileReader();
    reader.onload = () => setDocFileData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) { setDocError('Document name is required.'); return; }
    if (!docEmployee) { setDocError('Please select an employee.'); return; }
    if (!docFile) { setDocError('Please attach a document file.'); return; }
    setDocs(prev => [{
      id: `doc-${Date.now()}`, name: docName.trim(), type: docType, employee: docEmployee,
      uploadedDate: new Date().toISOString().slice(0, 10), expiryDate: docExpiry || null, status: 'Active',
      fileData: docFileData, fileName: docFile,
    }, ...prev]);
    setShowUpload(false);
    resetUpload();
  };

  const downloadDoc = (doc: (typeof docs)[number]) => {
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName || `${doc.name.replace(/\s+/g, '-')}`;
      a.click();
    } else {
      const text = `Document: ${doc.name}\nEmployee: ${doc.employee}\nType: ${doc.type}\nUploaded: ${doc.uploadedDate}\nExpiry: ${doc.expiryDate || '—'}\nStatus: ${doc.status}\n\nNo file attached (older record).`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name.replace(/\s+/g, '-')}-info.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Documents"
<<<<<<< HEAD
          subtitle="Company and employee documents in one place"
          actions={!isEmployee && <Button variant="primary" onClick={() => { resetUpload(); setShowUpload(true); }} className="cursor-pointer whitespace-nowrap"><Upload size={16} /> Upload</Button>}
=======
          actions={!isEmployee && <Button variant="primary"><Upload size={16} /> Upload</Button>}
>>>>>>> 8cc082be15aa43251f6903f3add562590a741837
        />

        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search documents..." className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-[#024fa7] text-white' : 'bg-[#EAF2F4] text-[#263238] hover:bg-[#D6E4E8]'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} hover>
              <div className="flex items-start gap-3">
                <div className="bg-[#EAF2F4] p-3 rounded-lg"><FileText size={24} className="text-[#024fa7]" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#17324D] truncate">{doc.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.employee}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.type} · Uploaded {doc.uploadedDate}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={doc.status === 'Active' ? 'success' : 'warning'} size="sm">
                      {doc.status === 'Expiring Soon' && <Clock size={10} className="mr-1" />}
                      {doc.status}
                    </Badge>
                    <div className="flex gap-1">
                      <button title="View document" onClick={() => setViewDoc(doc)} className="p-1.5 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4] cursor-pointer"><Eye size={14} /></button>
                      <button title="Download document" onClick={() => downloadDoc(doc)} className="p-1.5 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4] cursor-pointer"><Download size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); resetUpload(); }} title="Upload Document" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          <Input label="Document Name" placeholder="e.g. Employment Contract" value={docName} onChange={e => setDocName(e.target.value)} required />
          <Select label="Employee" value={docEmployee} onChange={e => setDocEmployee(e.target.value)}
            options={[{ value: '', label: 'Select employee…' }, { value: 'All Employees', label: 'All Employees' }, ...mockEmployees.map(e => ({ value: `${e.firstName} ${e.lastName}`, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Document Type" value={docType} onChange={e => setDocType(e.target.value)}
              options={['Contract', 'ID', 'Legal', 'Policy', 'Certificate'].map(t => ({ value: t, label: t }))} required />
            <Input label="Expiry Date (optional)" type="date" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">Attach Document</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3 hover:border-[#024fa7] hover:bg-[#EAF2F4]/50 transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2F4] text-[#024fa7]"><Upload size={17} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[#263238] truncate">{docFile || 'Choose file'}</span>
                <span className="block text-xs text-gray-500 mt-0.5">PDF, DOC, JPG or PNG up to 10 MB</span>
              </span>
              {docFile && <button type="button" title="Remove file" onClick={e => { e.preventDefault(); setDocFile(''); setDocFileData(''); }} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><X size={14} /></button>}
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only"
                onChange={e => handleFilePick(e.target.files?.[0])} />
            </label>
            {docFile && <p className="mt-2 flex items-center gap-2 text-xs text-gray-600 rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-3 py-2"><Paperclip size={12} className="text-[#024fa7]" /><span className="truncate flex-1">{docFile}</span></p>}
          </div>
          {docError && <p className="text-sm text-red-500">{docError}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={() => { setShowUpload(false); resetUpload(); }}>Cancel</Button>
            <Button variant="primary" type="submit"><Upload size={16} /> Upload</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title="Document Details" size="lg">
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
                  <img src={viewDoc.fileData} alt={viewDoc.name} className="max-h-[50vh] rounded-lg mx-auto" />
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
              <Button variant="outline" onClick={() => setViewDoc(null)}>Close</Button>
              <Button variant="primary" onClick={() => downloadDoc(viewDoc)}><Download size={16} /> Download</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
