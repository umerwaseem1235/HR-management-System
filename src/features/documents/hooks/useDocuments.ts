import { useCallback, useEffect, useState } from 'react';
import { useEmployee } from '@/hooks/useEmployee';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/client';
import { DocumentItem } from '../types';
import { createDocument, deleteDocument, getDocumentDownloadUrl, getDocuments } from '@/lib/actions/documents';
import { cachedQuery, invalidateQuery, peekStaleQuery } from '@/lib/query-cache';

const DOCUMENTS_BUCKET = 'documents';

// Shared list cache — one entry for the whole documents module.
const DOCUMENTS_CACHE_KEY = 'documents';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general';
}

export function useDocuments() {
  const { user, employeeName, isEmployee } = useEmployee();
  const { user: authUser } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  // Stale-while-revalidate seeds: paint the last visit's list on the first
  // frame when navigating back — no empty "No documents" flash. (The cache is
  // always empty during SSR/hydration, so this stays hydration-safe.)
  const [docs, setDocs] = useState<DocumentItem[]>(
    () => peekStaleQuery<DocumentItem[]>(DOCUMENTS_CACHE_KEY) ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => peekStaleQuery<DocumentItem[]>(DOCUMENTS_CACHE_KEY) === undefined,
  );
  const [loadError, setLoadError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);
  const [docName, setDocName] = useState('');
  const [docEmployee, setDocEmployee] = useState('');
  const [docType, setDocType] = useState('Contract');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docFileData, setDocFileData] = useState('');
  const [docFileObj, setDocFileObj] = useState<File | null>(null);
  const [docError, setDocError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const refresh = useCallback(async () => {
    // Only surface the loading state when there is nothing painted yet; a
    // cached list stays visible while cachedQuery revalidates in the background.
    if (peekStaleQuery<DocumentItem[]>(DOCUMENTS_CACHE_KEY) === undefined) {
      setIsLoading(true);
    }
    setLoadError('');
    try {
      setDocs(await cachedQuery(DOCUMENTS_CACHE_KEY, getDocuments));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    setDocName(''); setDocEmployee(''); setDocType('Contract'); setDocExpiry(''); setDocFile(''); setDocFileData(''); setDocFileObj(null); setDocError('');
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
    if (!file) { setDocFile(''); setDocFileData(''); setDocFileObj(null); return; }
    if (file.size > 10 * 1024 * 1024) { setDocError('File must be smaller than 10MB.'); return; }
    setDocError('');
    setDocFile(file.name);
    setDocFileObj(file);
    const reader = new FileReader();
    reader.onload = () => setDocFileData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setDocFile('');
    setDocFileData('');
    setDocFileObj(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) { setDocError('Document name is required.'); return; }
    if (!docEmployee) { setDocError('Please select an employee.'); return; }
    if (!docFileObj) { setDocError('Please attach a document file.'); return; }
    setIsUploading(true);
    try {
      // 1. Bytes go straight to the Storage bucket (never through the DB row)
      const path = `${slugify(docEmployee)}/${Date.now()}_${docFileObj.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
      const browser = createClient();
      const { error: uploadErr } = await browser.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, docFileObj, { contentType: docFileObj.type || undefined, upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      // 2. Only metadata + storage path are stored in Supabase
      await createDocument({
        name: docName.trim(),
        type: docType,
        employee: docEmployee,
        expiryDate: docExpiry || undefined,
        filePath: path,
        fileName: docFileObj.name,
        uploadedBy: authUser?.name || user?.name,
      });
      invalidateQuery(DOCUMENTS_CACHE_KEY);
      await refresh();
      setShowUpload(false);
      resetUpload();
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = docs.find((d) => d.id === id);
    if (!confirm(`Delete document "${target?.name || 'this document'}"? This cannot be undone.`)) return;
    await deleteDocument(id);
    invalidateQuery(DOCUMENTS_CACHE_KEY);
    await refresh();
  };

  const downloadDoc = async (doc: DocumentItem) => {
    // Bucket-backed files resolve to a short-lived signed URL
    if (doc.filePath) {
      try {
        const url = await getDocumentDownloadUrl(doc.id);
        window.open(url, '_blank', 'noopener');
        return;
      } catch (err) {
        console.error('Signed URL failed, falling back:', err);
      }
    }
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
    isLoading, loadError, refresh,
    showUpload, openUpload, closeUpload,
    viewDoc, setViewDoc,
    docName, setDocName,
    docEmployee, setDocEmployee,
    docType, setDocType,
    docExpiry, setDocExpiry,
    docFile, docFileData, docError, isUploading,
    handleFilePick, removeFile, handleUpload, handleDelete, downloadDoc,
  };
}

export type UseDocumentsReturn = ReturnType<typeof useDocuments>;
