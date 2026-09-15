'use client';

import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { FileText, FolderOpen, Download, Eye, Clock } from 'lucide-react';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  employee: string;
  uploadedDate: string;
  expiryDate: string | null;
  status: string;
  fileData?: string;
  fileName?: string;
}

interface DocumentTableProps {
  documents: DocumentItem[];
  isEmployee: boolean;
  onView: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
}

export default function DocumentTable({ documents, isEmployee, onView, onDownload }: DocumentTableProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
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
                    <button title="View document" onClick={() => onView(doc)} className="p-1.5 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4] cursor-pointer"><Eye size={14} /></button>
                    <button title="Download document" onClick={() => onDownload(doc)} className="p-1.5 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4] cursor-pointer"><Download size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {documents.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="bg-[#EAF2F4] p-3 rounded-full"><FolderOpen size={24} className="text-[#024fa7]" /></div>
            <p className="text-sm font-semibold text-[#17324D]">No documents found</p>
            <p className="text-xs text-gray-500">
              {isEmployee
                ? 'No documents have been shared with you yet. Documents added for you by Super Admin will appear here.'
                : 'Try adjusting your search or category filter.'}
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
