'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { FileText, Download, Eye, Clock, Trash2 } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentListProps {
  docs: DocumentItem[];
  onView: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DocumentList({ docs, onView, onDownload, onDelete, canDelete, emptyTitle, emptyDescription }: DocumentListProps) {
  if (docs.length === 0) {
    return (
      <Card>
        <EmptyState
          title={emptyTitle || 'No documents found'}
          description={emptyDescription || 'No documents match your current filters.'}
        />
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map(doc => (
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
                  {canDelete && onDelete && (
                    <button title="Delete document" onClick={() => onDelete(doc.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
