'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Upload, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockEmployees } from '../../lib/mock-data';
import DocumentFilters from '../../components/documents/DocumentFilters';
import DocumentTable, { DocumentItem } from '../../components/documents/DocumentTable';
import UploadModal from '../../components/documents/UploadModal';
import { Download } from 'lucide-react';

const mockDocuments: DocumentItem[] = [
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
  const [docs, setDocs] = useState<DocumentItem[]>(mockDocuments);
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);
  const [docName, setDocName] = useState('');
  const [docEmployee, setDocEmployee] = useState('');
  const [docType, setDocType] = useState('Contract');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docFileData, setDocFileData] = useState('');
  const [docError, setDocError] = useState('');

  // Resolve the logged-in user to an employee record (same matching as other pages)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  const myName = employee ? `${employee.firstName} ${employee.lastName}` : user?.name ?? '';

  const filtered = docs.filter(doc => {
    // Employees see only their own documents (+ company-wide ones), never other employees' files.
    // Upload is manager-only (Upload button is hidden for employees), so this list is view-only for them.
    if (isEmployee && doc.employee !== 'All Employees' && doc.employee !== myName) return false;
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

  const downloadDoc = (doc: DocumentItem) => {
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
          actions={!isEmployee && <Button variant="primary" onClick={() => { resetUpload(); setShowUpload(true); }} className="cursor-pointer whitespace-nowrap"><Upload size={16} /> Upload</Button>}
        />

        <DocumentFilters
          search={search}
          category={category}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
        />

        <DocumentTable
          documents={filtered}
          isEmployee={!!isEmployee}
          onView={setViewDoc}
          onDownload={downloadDoc}
        />
      </div>

      <UploadModal
        isOpen={showUpload}
        docName={docName}
        docEmployee={docEmployee}
        docType={docType}
        docExpiry={docExpiry}
        docFile={docFile}
        docError={docError}
        onDocNameChange={setDocName}
        onDocEmployeeChange={setDocEmployee}
        onDocTypeChange={setDocType}
        onDocExpiryChange={setDocExpiry}
        onFilePick={handleFilePick}
        onClearFile={() => { setDocFile(''); setDocFileData(''); }}
        onClose={() => { setShowUpload(false); resetUpload(); }}
        onSubmit={handleUpload}
      />

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
