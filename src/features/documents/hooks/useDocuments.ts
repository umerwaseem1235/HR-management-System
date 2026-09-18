import { useState } from 'react';
import { useEmployee } from '@/hooks/useEmployee';
import { DocumentItem, SEED_DOCUMENTS } from '../types';

export function useDocuments() {
  const { user, employeeName, isEmployee } = useEmployee();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [docs, setDocs] = useState<DocumentItem[]>(SEED_DOCUMENTS);
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);
  const [docName, setDocName] = useState('');
  const [docEmployee, setDocEmployee] = useState('');
  const [docType, setDocType] = useState('Contract');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docFileData, setDocFileData] = useState('');
  const [docError, setDocError] = useState('');

  const filtered = docs.filter(doc => {
    // Employees see only their own documents plus company-wide shared ones.
    // Admin/HR see everything.
    if (isEmployee) {
      const owner = doc.employee.trim().toLowerCase();
      const mine = employeeName.trim().toLowerCase();
      const isMine = owner === mine;
      const isShared = owner === 'all employees';
      if (!isMine && !isShared) return false;
    }
    const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.employee.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || doc.type === category;
    return matchSearch && matchCat;
  });

  const resetUpload = () => {
    setDocName(''); setDocEmployee(''); setDocType('Contract'); setDocExpiry(''); setDocFile(''); setDocFileData(''); setDocError('');
  };

  const openUpload = () => {
    resetUpload();
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
    resetUpload();
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

  const removeFile = () => {
    setDocFile('');
    setDocFileData('');
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

  return {
    isEmployee,
    search, setSearch,
    category, setCategory,
    docs, filtered,
    showUpload, openUpload, closeUpload,
    viewDoc, setViewDoc,
    docName, setDocName,
    docEmployee, setDocEmployee,
    docType, setDocType,
    docExpiry, setDocExpiry,
    docFile, docFileData, docError,
    handleFilePick, removeFile, handleUpload, downloadDoc,
  };
}

export type UseDocumentsReturn = ReturnType<typeof useDocuments>;
