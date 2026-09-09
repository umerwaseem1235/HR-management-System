'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import { Mail, Phone, MapPin, Calendar, Edit, ArrowLeft, Bell, CheckCircle2, Clock, Download, Eye, FileText, Lock, ShieldCheck, Upload } from 'lucide-react';
import Link from 'next/link';
import { mockEmployees, mockAttendance, mockLeaveBalances, mockPayslips, mockGoals, mockAssets } from '../../../lib/mock-data';
import { useAuth } from '../../../contexts/AuthContext';

type EmployeeDocument = {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  expiryDate?: string;
  status: 'Active' | 'Expiring Soon' | 'Acknowledged' | 'Pending Acknowledgement';
};

const documentTemplates: Record<string, EmployeeDocument[]> = {
  '1': [
    { id: 'doc-1', name: 'Employment Contract', type: 'Contract', uploadedDate: '2022-03-01', status: 'Active' },
    { id: 'doc-2', name: 'Passport Copy', type: 'Identification', uploadedDate: '2022-03-01', expiryDate: '2027-03-01', status: 'Active' },
    { id: 'doc-3', name: 'Computer Science Degree', type: 'Education / Certification', uploadedDate: '2022-03-02', status: 'Active' },
    { id: 'doc-4', name: 'Offer Letter', type: 'Offer / Joining', uploadedDate: '2022-02-20', status: 'Active' },
    { id: 'doc-5', name: 'Code of Conduct Policy', type: 'Policy Acknowledgement', uploadedDate: '2024-01-05', status: 'Acknowledged' },
  ],
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const employee = mockEmployees.find(e => e.id === params.id) || mockEmployees[0];
  const [documents, setDocuments] = useState<EmployeeDocument[]>(() => documentTemplates[employee.id] || []);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showPayrollDetails, setShowPayrollDetails] = useState(false);
  const [reminderSetFor, setReminderSetFor] = useState<string[]>([]);
  const canViewPayroll = user?.role === 'super_admin' || user?.role === 'hr_manager';

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'documents', label: 'Documents' },
    { id: 'assets', label: 'Assets' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success', Inactive: 'danger', 'On Notice': 'warning', Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-[#D6E4E8] last:border-0">
      <span className="text-sm text-gray-500 sm:w-48 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm font-medium text-[#263238]">{value || '—'}</span>
    </div>
  );

  const handleDocumentUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    const file = event.currentTarget.elements.namedItem('documentFile') as HTMLInputElement | null;
    const document: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      name: file?.files?.[0]?.name || values.documentName,
      type: values.documentType,
      uploadedDate: new Date().toISOString().slice(0, 10),
      expiryDate: values.expiryDate || undefined,
      status: values.documentType === 'Policy Acknowledgement' ? 'Pending Acknowledgement' : 'Active',
    };
    setDocuments(current => [document, ...current]);
    setIsUploadOpen(false);
  };

  const toggleReminder = (documentId: string) => {
    setReminderSetFor(current => current.includes(documentId) ? current.filter(id => id !== documentId) : [...current, documentId]);
  };

  const acknowledgeDocument = (documentId: string) => {
    setDocuments(current => current.map(document => document.id === documentId ? { ...document, status: 'Acknowledged' } : document));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-[#0F8B8D] hover:underline">
          <ArrowLeft size={16} /> Back to Employees
        </Link>

        {/* Profile Header */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#17324D]">{employee.firstName} {employee.lastName}</h1>
                {statusBadge(employee.status)}
              </div>
              <p className="text-gray-500">{employee.designation} · {employee.department}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {employee.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {employee.branch}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Joined {employee.joiningDate}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit size={14} /> Edit
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {activeTab === 'personal' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Personal Information</h3>
                <InfoRow label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                <InfoRow label="Employee Code" value={employee.employeeCode} />
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Phone" value={employee.phone} />
                <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
                <InfoRow label="Gender" value={employee.gender} />
                <InfoRow label="Address" value={`${employee.address}, ${employee.city}, ${employee.country}`} />
                <h3 className="text-base font-semibold text-[#17324D] mt-6 mb-4">Emergency Contact</h3>
                <InfoRow label="Name" value={employee.emergencyContactName} />
                <InfoRow label="Phone" value={employee.emergencyContactPhone} />
              </div>
            )}
            {activeTab === 'employment' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Employment Details</h3>
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Designation" value={employee.designation} />
                <InfoRow label="Branch" value={employee.branch} />
                <InfoRow label="Reporting Manager" value={employee.reportingManager} />
                <InfoRow label="Employment Type" value={employee.employmentType} />
                <InfoRow label="Joining Date" value={employee.joiningDate} />
                <InfoRow label="Probation End Date" value={employee.probationEndDate || 'Not set'} />
                <InfoRow label="Confirmation Date" value={employee.confirmationDate || 'Not confirmed'} />
                <InfoRow label="Shift" value={employee.shift} />
                <InfoRow label="Status" value={employee.status} />
              </div>
            )}
            {activeTab === 'attendance' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Recent Attendance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-[#EAF2F4]">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Check In</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Check Out</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Hours</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#D6E4E8]">
                      {mockAttendance.filter(a => a.employeeId === employee.id).map(att => (
                        <tr key={att.id}>
                          <td className="px-4 py-3 text-sm">{att.date}</td>
                          <td className="px-4 py-3 text-sm">{att.checkIn || '—'}</td>
                          <td className="px-4 py-3 text-sm">{att.checkOut || '—'}</td>
                          <td className="px-4 py-3"><Badge variant={att.status === 'Present' ? 'success' : att.status === 'Late' ? 'warning' : 'danger'} size="sm">{att.status}</Badge></td>
                          <td className="px-4 py-3 text-sm">{att.workHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'leave' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Leave Balances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockLeaveBalances.map(bal => (
                    <div key={bal.leaveType} className="p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{bal.leaveType}</span>
                        <span className="text-sm font-bold text-[#17324D]">{bal.remaining}/{bal.total}</span>
                      </div>
                      <div className="w-full bg-[#D6E4E8] rounded-full h-2">
                        <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: `${(bal.used / bal.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'payroll' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div><h3 className="text-base font-semibold text-[#17324D]">Payroll & Bank Information</h3><p className="text-xs text-gray-500 mt-1">Restricted to authorized HR and Super Admin users.</p></div>
                  {canViewPayroll && <Button variant="outline" size="sm" onClick={() => setShowPayrollDetails(current => !current)}><Lock size={14} /> {showPayrollDetails ? 'Hide Details' : 'Reveal Details'}</Button>}
                </div>
                {canViewPayroll ? (
                  <div className="mb-6 rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[#17324D]"><ShieldCheck size={16} className="text-[#0F8B8D]" /> Protected Payroll Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"><div><p className="text-xs text-gray-500">Bank Name</p><p className="font-medium mt-1">{showPayrollDetails ? employee.bankName || 'Not provided' : '••••••••'}</p></div><div><p className="text-xs text-gray-500">Account Number</p><p className="font-medium mt-1">{showPayrollDetails ? employee.bankAccount || 'Not provided' : '••••••••'}</p></div><div><p className="text-xs text-gray-500">Tax ID</p><p className="font-medium mt-1">{showPayrollDetails ? employee.taxId || 'Not provided' : '••••••••'}</p></div></div>
                  </div>
                ) : <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">You do not have permission to view payroll or bank information.</div>}
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Payslip History</h3>
                <div className="space-y-3">
                  {mockPayslips.map(slip => (
                    <div key={slip.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{slip.month} {slip.year}</p>
                        <p className="text-xs text-gray-500">Generated: {slip.generatedOn}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#17324D]">${slip.netSalary.toLocaleString()}</p>
                        <Badge variant="success" size="sm">{slip.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'documents' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><div><h3 className="text-base font-semibold text-[#17324D]">Employee Documents</h3><p className="text-sm text-gray-500 mt-1">Contracts, identification, certifications and acknowledgements.</p></div><Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}><Upload size={14} /> Upload Document</Button></div>
                {documents.length === 0 ? <div className="rounded-lg border border-dashed border-[#D6E4E8] p-10 text-center text-sm text-gray-500">No documents uploaded for this employee.</div> : <div className="space-y-3">{documents.map(document => <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#D6E4E8] p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[#EAF2F4] p-2 text-[#0F8B8D]"><FileText size={18} /></div><div><p className="text-sm font-medium text-[#263238]">{document.name}</p><p className="text-xs text-gray-500">{document.type} · Uploaded {document.uploadedDate}</p>{document.expiryDate && <p className="text-xs text-gray-500 mt-1">Expires {document.expiryDate}</p>}</div></div><div className="flex items-center gap-2"><Badge variant={document.status === 'Active' || document.status === 'Acknowledged' ? 'success' : document.status === 'Expiring Soon' ? 'warning' : 'info'} size="sm">{document.status}</Badge>{document.status === 'Pending Acknowledgement' && <button type="button" onClick={() => acknowledgeDocument(document.id)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"><CheckCircle2 size={13} /> Acknowledge</button>}{document.expiryDate && <button type="button" onClick={() => toggleReminder(document.id)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${reminderSetFor.includes(document.id) ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-[#EAF2F4]'}`}><Bell size={13} /> {reminderSetFor.includes(document.id) ? 'Reminder Set' : 'Remind Me'}</button>}<button type="button" className="p-1.5 text-gray-400 hover:text-[#0F8B8D]" title="View document"><Eye size={15} /></button><button type="button" className="p-1.5 text-gray-400 hover:text-[#0F8B8D]" title="Download document"><Download size={15} /></button></div></div>)}</div>}
              </div>
            )}
            {activeTab === 'assets' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Assigned Assets</h3>
                <div className="space-y-3">
                  {mockAssets.filter(a => a.assignedTo === employee.id).map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{asset.name}</p>
                        <p className="text-xs text-gray-500">{asset.type} · {asset.serialNumber}</p>
                      </div>
                      <Badge variant={asset.condition === 'New' ? 'success' : asset.condition === 'Good' ? 'info' : 'warning'} size="sm">{asset.condition}</Badge>
                    </div>
                  ))}
                  {mockAssets.filter(a => a.assignedTo === employee.id).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No assets assigned.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
        <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Employee Document" size="md">
          <form className="space-y-4" onSubmit={handleDocumentUpload}>
            <Input name="documentName" label="Document Name" placeholder="e.g. Employment Contract" required />
            <Select name="documentType" label="Document Type" options={[{ value: 'Contract', label: 'Employment Contract' }, { value: 'Identification', label: 'Identification Document' }, { value: 'Education / Certification', label: 'Education / Certification' }, { value: 'Offer / Joining', label: 'Offer / Joining Document' }, { value: 'Policy Acknowledgement', label: 'Policy Acknowledgement' }, { value: 'Other', label: 'Other Organization File' }]} required />
            <Input name="expiryDate" label="Expiry Date (optional)" type="date" />
            <div><label htmlFor="documentFile" className="block text-sm font-medium text-[#263238] mb-1.5">File</label><input id="documentFile" name="documentFile" type="file" className="block w-full rounded-lg border border-[#D6E4E8] px-3 py-2 text-sm" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /></div>
            <p className="text-xs text-gray-500">Policy acknowledgement documents are marked for acknowledgement after upload.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#D6E4E8]"><Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button><Button type="submit"><Upload size={15} /> Upload Document</Button></div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
