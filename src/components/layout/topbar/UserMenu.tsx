'use client';

import React from 'react';
import { ChevronDown, User, Settings, KeyRound, LogOut } from 'lucide-react';
import { ROLE_LABELS } from '../../../lib/constants';
import type { User as AuthUser } from '../../../lib/types';

interface UserMenuProps {
  user: AuthUser;
  open: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function UserMenu({ user, open, onToggle, onNavigate, onLogout }: UserMenuProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition-all active:scale-[0.98] sm:pr-3 ${open ? 'bg-[#EAF2F4]' : 'hover:bg-[#EAF2F4]'}`}
      >
        <span className="relative">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#024fa7] to-[#17324D] text-xs font-bold text-white shadow-md shadow-[#024fa7]/30 ring-2 ring-white">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        </span>
        <span className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-[#263238]">{user.name}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{ROLE_LABELS[user.role]}</p>
        </span>
        <ChevronDown size={15} className={`hidden text-gray-400 transition-transform duration-200 sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#D6E4E8] bg-white p-1.5 shadow-2xl shadow-[#17324D]/15">
          <div className="rounded-xl bg-[#F8FBFC] px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-[#263238]">{user.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={() => onNavigate('/profile')}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#263238] transition-colors hover:bg-[#EAF2F4]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF2F4] text-[#024fa7]">
              <User size={15} />
            </span>
            My Profile
          </button>
          <button
            onClick={() => onNavigate('/settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#263238] transition-colors hover:bg-[#EAF2F4]"
          >
            {user.role === 'super_admin' ? (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Settings size={15} />
                </span>
                Settings
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <KeyRound size={15} />
                </span>
                Change Password
              </>
            )}
          </button>
          <div className="my-1.5 border-t border-[#D6E4E8]/60" />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <LogOut size={15} />
            </span>
            Sign Out
          </button>
        </div>
      )}
    </>
  );
}

export default UserMenu;
