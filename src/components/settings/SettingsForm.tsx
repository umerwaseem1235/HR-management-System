'use client';

import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Save } from 'lucide-react';
import { COMPANY_DEFAULTS, type CompanySettings } from '@/lib/company-settings';
import { getCompanySettings, saveCompanySettings } from '@/lib/actions/settings';

export default function SettingsForm() {
  const [form, setForm] = useState<CompanySettings>(COMPANY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCompanySettings();
        if (!cancelled) setForm(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load company settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field: keyof CompanySettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');
    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    setSaving(true);
    try {
      await saveCompanySettings(form);
      setSavedMsg('Company information saved — applied across the system.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
      )}
      {savedMsg && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">{savedMsg}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company Name" value={form.companyName} onChange={set('companyName')} />
        <Input label="Registration No." value={form.regNo} onChange={set('regNo')} />
        <Input label="Email" value={form.email} onChange={set('email')} />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
        <Input label="Address" value={form.address} onChange={set('address')} className="sm:col-span-2" />
        <Input label="Website" value={form.website} onChange={set('website')} />
        <Input label="Tax ID" value={form.taxId} onChange={set('taxId')} />
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="primary" type="submit" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
