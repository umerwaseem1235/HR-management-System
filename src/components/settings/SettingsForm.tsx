'use client';

import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Save } from 'lucide-react';
import { getSettings, updateSetting } from '../../lib/actions/settings';

const FIELDS = [
  { key: 'company_name', label: 'Company Name', fallback: 'CodQor Inc.' },
  { key: 'reg_no', label: 'Registration No.', fallback: 'REG-2018-001' },
  { key: 'email', label: 'Email', fallback: 'contact@codqor.com' },
  { key: 'phone', label: 'Phone', fallback: '+1-555-0000' },
  { key: 'address', label: 'Address', fallback: '100 Tech Avenue, New York, NY', span: true },
  { key: 'website', label: 'Website', fallback: 'https://codqor.com' },
  { key: 'tax_id', label: 'Tax ID', fallback: 'TAX-123456' },
];

export default function SettingsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSettings();
        if (!cancelled) setValues(data);
      } catch (err) {
        if (!cancelled) setMessage({ kind: 'error', text: 'Failed to load company settings.' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await Promise.all(
        FIELDS.map((f) => updateSetting(f.key, values[f.key] ?? f.fallback)),
      );
      setMessage({ kind: 'success', text: 'Company information saved.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h3 className="text-base font-semibold text-[#17324D]">Company Information</h3>
      {message && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm ${
          message.kind === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <Input
            key={f.key}
            label={f.label}
            value={isLoading ? '' : (values[f.key] ?? f.fallback)}
            onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            disabled={isLoading || isSaving}
            className={f.span ? 'sm:col-span-2' : ''}
          />
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="primary" onClick={handleSave} disabled={isLoading} loading={isSaving}>
          <Save size={16} /> Save Changes
        </Button>
      </div>
    </div>
  );
}
