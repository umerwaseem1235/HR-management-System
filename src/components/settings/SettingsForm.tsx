'use client';

import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Save } from 'lucide-react';
import { COMPANY_DEFAULTS, type CompanySettings } from '@/lib/company-settings';
import { getCompanySettings, saveCompanySettings } from '@/lib/actions/settings';
import { createResourceCache } from '@/lib/resource-cache';

// Module scope survives navigation, so returning to /settings paints the
// previously loaded company form instantly instead of re-querying.
const companyCache = createResourceCache<CompanySettings>('settings:company', 5 * 60_000);

export default function SettingsForm() {
  const [form, setForm] = useState<CompanySettings>(() => companyCache.get() ?? COMPANY_DEFAULTS);
  const [isLoading, setIsLoading] = useState(() => companyCache.get() === null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = companyCache.peek();
      if (snapshot) {
        if (!cancelled) {
          setForm(snapshot.data);
          setIsLoading(false);
        }
        if (!snapshot.isStale) return;
      }
      try {
        const data = await companyCache.load(getCompanySettings, { force: true });
        if (!cancelled) setForm(data);
      } catch (err) {
        if (!cancelled) setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to load company settings.' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field: keyof CompanySettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.companyName.trim()) {
      setMessage({ kind: 'error', text: 'Company name is required.' });
      return;
    }
    setIsSaving(true);
    try {
      await saveCompanySettings(form);
      companyCache.set(form);
      setMessage({ kind: 'success', text: 'Company information saved — applied across the system.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to save. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-5 animate-pulse">
        <div className="h-5 w-48 rounded bg-[#EAF2F4]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-[#EAF2F4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
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
        <Input label="Company Name" value={form.companyName} onChange={set('companyName')} disabled={isSaving} />
        <Input label="Registration No." value={form.regNo} onChange={set('regNo')} disabled={isSaving} />
        <Input label="Email" value={form.email} onChange={set('email')} disabled={isSaving} />
        <Input label="Phone" value={form.phone} onChange={set('phone')} disabled={isSaving} />
        <Input label="Address" value={form.address} onChange={set('address')} className="sm:col-span-2" disabled={isSaving} />
        <Input label="Website" value={form.website} onChange={set('website')} disabled={isSaving} />
        <Input label="Tax ID" value={form.taxId} onChange={set('taxId')} disabled={isSaving} />
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="primary" type="submit" loading={isSaving}>
          <Save size={16} /> Save Changes
        </Button>
      </div>
    </form>
  );
}
