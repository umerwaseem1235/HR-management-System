/* Shared company-settings shape + fallbacks.
 * Kept in a plain module (no "use server") because server-action files may
 * only export async functions. */

export interface CompanySettings {
  companyName: string;
  regNo: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxId: string;
}

export const COMPANY_DEFAULTS: CompanySettings = {
  companyName: 'CodQor Inc.',
  regNo: 'REG-2018-001',
  email: 'contact@codqor.com',
  phone: '+1-555-0000',
  address: '100 Tech Avenue, New York, NY',
  website: 'https://codqor.com',
  taxId: 'TAX-123456',
};
