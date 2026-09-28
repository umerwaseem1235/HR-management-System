'use client';

import React from 'react';
import { ChevronDown, User, Settings, KeyRound, LogOut } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import type { User as AuthUser } from '../../../lib/types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface UserMenuProps {
  user: AuthUser;
  open: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function UserMenu({ user, open, onToggle, onNavigate, onLogout }: UserMenuProps) {
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition-all active:scale-[0.98] sm:pr-3 ${open ? 'bg-blue-gray dark:bg-white/10' : 'hover:bg-blue-gray dark:hover:bg-white/10'}`}
      >
        <span className="relative block shrink-0">
          {/* Shared Avatar shows the uploaded photo for image URLs
              (including base64 data URLs) and initials otherwise. */}
          <Avatar name={user.name} src={user.avatar} size="md" className="h-9 w-9 text-xs shadow-md ring-2 ring-white dark:ring-[#0f1b2e]" />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0f1b2e] bg-green-500" />
        </span>
        <span className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-dark-text dark:text-gray-100">{user.name}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{t(`role.${user.role}`)}</p>
        </span>
        <ChevronDown size={15} className={`hidden text-gray-400 dark:text-gray-500 transition-transform duration-200 sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-medium-gray dark:border-white/10 bg-white dark:bg-[#1b263b] p-1.5 shadow-2xl shadow-primary/15">
          <div className="rounded-xl bg-blue-gray-light dark:bg-white/5 px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-dark-text dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(`role.${user.role}`)}</p>
          </div>
          <button
            onClick={() => onNavigate('/profile')}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-dark-text dark:text-gray-100 transition-colors hover:bg-blue-gray dark:hover:bg-white/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-gray dark:bg-white/10 text-teal">
              <User size={15} />
            </span>
            {t('profile.title')}
          </button>
          <button
            onClick={() => onNavigate('/settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-dark-text dark:text-gray-100 transition-colors hover:bg-blue-gray dark:hover:bg-white/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              <Settings size={15} />
            </span>
            {t('settings.title')}
          </button>
          <div className="my-1.5 border-t border-medium-gray/60 dark:border-white/10" />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <LogOut size={15} />
            </span>
            {t('action.logout')}
          </button>
        </div>
      )}
    </>
  );
}

export default UserMenu;
