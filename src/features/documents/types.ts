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

export const CATEGORIES = ['All', 'Contract', 'ID', 'Legal', 'Policy', 'Certificate'];

export const SEED_DOCUMENTS: DocumentItem[] = [
  { id: '1', name: 'Employment Contract', type: 'Contract', employee: 'Michael Chen', uploadedDate: '2022-03-01', expiryDate: null, status: 'Active' },
  { id: '2', name: 'NDA Agreement', type: 'Legal', employee: 'All Employees', uploadedDate: '2024-01-01', expiryDate: '2025-01-01', status: 'Active' },
  { id: '3', name: 'Health Insurance Card', type: 'ID', employee: 'Sarah Williams', uploadedDate: '2023-06-15', expiryDate: '2024-06-15', status: 'Expiring Soon' },
  { id: '4', name: 'Driving License', type: 'ID', employee: 'James Anderson', uploadedDate: '2023-01-10', expiryDate: '2026-01-10', status: 'Active' },
  { id: '5', name: 'Company Policy Handbook', type: 'Policy', employee: 'All Employees', uploadedDate: '2024-01-01', expiryDate: null, status: 'Active' },
  { id: '6', name: 'Work Permit', type: 'ID', employee: 'Priya Sharma', uploadedDate: '2023-02-01', expiryDate: '2024-02-15', status: 'Expiring Soon' },
];
