'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import { Upload, FileText, File, FolderOpen, Download, Eye, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

  const filtered = mockDocuments.filter(doc => {
    const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.employee.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || doc.type === category;
    return matchSearch && matchCat;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#17324D]">Documents</h1>
          {!isEmployee && <Button variant="primary"><Upload size={16} /> Upload</Button>}
        </div>

        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search documents..." className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-[#0F8B8D] text-white' : 'bg-[#EAF2F4] text-[#263238] hover:bg-[#D6E4E8]'}`}>
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
                <div className="bg-[#EAF2F4] p-3 rounded-lg"><FileText size={24} className="text-[#0F8B8D]" /></div>
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
                      <button className="p-1.5 rounded text-gray-400 hover:text-[#0F8B8D] hover:bg-[#EAF2F4]"><Eye size={14} /></button>
                      <button className="p-1.5 rounded text-gray-400 hover:text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
