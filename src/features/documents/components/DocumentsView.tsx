'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import { Upload } from 'lucide-react';
import DocumentList from './DocumentList';
import DocumentUploadModal from './DocumentUploadModal';
import { useDocuments } from '../hooks/useDocuments';
import { CATEGORIES } from '../types';

export default function DocumentsView() {
  const d = useDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.isEmployee ? 'My Documents' : 'Documents'}
        actions={!d.isEmployee && <Button variant="primary" onClick={d.openUpload} className="cursor-pointer whitespace-nowrap"><Upload size={16} /> Upload</Button>}
      />

      {d.isEmployee && (
        <p className="text-xs text-gray-500 -mt-3">
          Showing only your personal documents and company-wide shared files.
        </p>
      )}

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={d.search} onChange={d.setSearch} placeholder="Search documents..." className="flex-1" />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => d.setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${d.category === cat ? 'bg-[#024fa7] text-white' : 'bg-[#EAF2F4] text-[#263238] hover:bg-[#D6E4E8]'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <DocumentList
        docs={d.filtered}
        onView={d.setViewDoc}
        onDownload={d.downloadDoc}
        onDelete={d.handleDelete}
        canDelete={!d.isEmployee}
        emptyTitle={d.isEmployee ? 'No documents for you yet' : 'No documents found'}
        emptyDescription={
          d.isEmployee
            ? 'Your personal documents and company-wide shared files will appear here.'
            : 'Upload a document or adjust your search filters.'
        }
      />

      <DocumentUploadModal
        showUpload={d.showUpload}
        onCloseUpload={d.closeUpload}
        onUpload={d.handleUpload}
        docName={d.docName}
        onDocNameChange={d.setDocName}
        docEmployee={d.docEmployee}
        onDocEmployeeChange={d.setDocEmployee}
        docType={d.docType}
        onDocTypeChange={d.setDocType}
        docExpiry={d.docExpiry}
        onDocExpiryChange={d.setDocExpiry}
        docFile={d.docFile}
        docError={d.docError}
        isUploading={d.isUploading}
        onFilePick={d.handleFilePick}
        onRemoveFile={d.removeFile}
        viewDoc={d.viewDoc}
        onCloseView={() => d.setViewDoc(null)}
        onDownload={d.downloadDoc}
      />
    </div>
  );
}
