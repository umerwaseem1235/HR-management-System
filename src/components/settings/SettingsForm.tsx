'use client';

import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Save } from 'lucide-react';

export default function SettingsForm() {
  return (
    <div className="max-w-2xl space-y-5">
      <h3 className="text-base font-semibold text-[#17324D]">Company Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company Name" defaultValue="CodQor Inc." />
        <Input label="Registration No." defaultValue="REG-2018-001" />
        <Input label="Email" defaultValue="contact@codqor.com" />
        <Input label="Phone" defaultValue="+1-555-0000" />
        <Input label="Address" defaultValue="100 Tech Avenue, New York, NY" className="sm:col-span-2" />
        <Input label="Website" defaultValue="https://codqor.com" />
        <Input label="Tax ID" defaultValue="TAX-123456" />
      </div>
      <div className="flex justify-end pt-4"><Button variant="primary"><Save size={16} /> Save Changes</Button></div>
    </div>
  );
}
