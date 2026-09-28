'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Select from '../ui/Select';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PreferencesForm() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activeBtn = 'border-[#0265cc] bg-[#f0f7ff] text-[#024fa7] shadow-[0_8px_24px_-10px_rgba(2,79,167,0.5)] dark:border-[#2563eb] dark:bg-[#2563eb]/15 dark:text-[#93c5fd] dark:shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)]';
  const inactiveBtn = 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary dark:text-white">{t('settings.preferences')}</h3>
      </div>

      <div className="space-y-6">
        {/* Theme — Light / Dark only */}
        <div>
          <div className="mb-3">
            <h4 className="text-sm font-medium text-dark-text dark:text-gray-200">{t('settings.appearance')}</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 max-w-sm gap-3">
            <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'light' ? activeBtn : inactiveBtn}`}>
              <Sun size={18} />
              <span className="font-medium text-sm">{t('settings.light')}</span>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? activeBtn : inactiveBtn}`}>
              <Moon size={18} />
              <span className="font-medium text-sm">{t('settings.dark')}</span>
            </button>
          </div>
        </div>

        {/* System language dropdown only — "Language / Choose your interface language" heading removed */}
        <div className="pt-6 border-t border-gray-100 dark:border-white/10">
          <div className="max-w-xs">
            <Select
              label={t('settings.systemLanguage')}
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
              options={[
                { value: 'en', label: 'English (US)' },
                { value: 'ur', label: 'اردو (Urdu)' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
