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
        title="Documents"
        actions={!d.isEmployee && <Button variant="primary" onClick={d.openUpload} className="cursor-pointer whitespace-nowrap"><Upload size={16} /> Upload</Button>}
      />

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

      <DocumentList docs={d.filtered} onView={d.setViewDoc} onDownload={d.downloadDoc} />

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
        onFilePick={d.handleFilePick}
        onRemoveFile={d.removeFile}
        viewDoc={d.viewDoc}
        onCloseView={() => d.setViewDoc(null)}
        onDownload={d.downloadDoc}
      />
    </div>
  );
}
