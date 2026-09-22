export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  employee: string;
  uploadedDate: string;
  expiryDate: string | null;
  status: string;
  fileData?: string;
  filePath?: string;
  fileName?: string;
}

export const CATEGORIES = ['All', 'Contract', 'ID', 'Legal', 'Policy', 'Certificate'];
