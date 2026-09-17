'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown, ShieldCheck, Briefcase, UserRound, Check } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface DemoAccount {
  role: string;
  email: string;
  pass: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Super Admin', email: 'admin@codqor.com', pass: 'admin123', description: 'Full system access', icon: ShieldCheck },
  { role: 'HR Manager', email: 'hr@codqor.com', pass: 'hr123', description: 'People operations', icon: Briefcase },
  { role: 'Employee', email: 'employee@codqor.com', pass: 'emp123', description: 'Self-service portal', icon: UserRound },
];

interface DemoAccountsDropdownProps {
  activeEmail: string;
  onSelect: (email: string, password: string) => void;
}

export default function DemoAccountsDropdown({ activeEmail, onSelect }: DemoAccountsDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  const selected = DEMO_ACCOUNTS.find((account) => account.email === activeEmail);

  const handleSelect = (account: DemoAccount) => {
    onSelect(account.email, account.pass);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select a demo account to auto-fill"
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30 focus:ring-offset-2 ${
          open
            ? 'border-[#1565D8]/40 bg-white shadow-sm ring-1 ring-[#1565D8]/20'
            : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#CBD5E1] hover:bg-white'
        }`}
      >
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
            selected ? 'bg-[#1565D8]/10 text-[#1565D8]' : 'bg-[#F3F4F6] text-[#9CA3AF] group-hover:text-[#1565D8]'
          }`}
        >
          {selected ? <selected.icon size={18} /> : <UserRound size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]">
                {selected.role}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[11px] text-[#6B7280]">
                {selected.email}
              </span>
            </>
          ) : (
            <>
              <span className="block truncate text-[13px] font-medium text-[#6B7280]">
                Select a demo account
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-[#9CA3AF]">
                Click to auto-fill credentials
              </span>
            </>
          )}
        </div>

        <ChevronDown
          size={17}
          className={`flex-shrink-0 text-[#9CA3AF] transition-transform duration-300 ${
            open ? 'rotate-180 text-[#1565D8]' : ''
          }`}
        />
      </button>

      {/* Panel */}
      {open && (
        <div className="login-fade-up absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]">
          <div className="border-b border-[#E5E7EB] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
              Demo Accounts
            </span>
          </div>

          <ul role="listbox" aria-label="Demo accounts" className="max-h-64 overflow-y-auto py-1">
            {DEMO_ACCOUNTS.map((account) => {
              const isSelected = account.email === activeEmail;
              return (
                <li key={account.email} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(account)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                      isSelected ? 'bg-[#1565D8]/[0.06]' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSelected ? 'bg-[#1565D8]/10 text-[#1565D8]' : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      <account.icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] font-semibold ${
                          isSelected ? 'text-[#1565D8]' : 'text-[#1a1a2e]'
                        }`}
                      >
                        {account.role}
                      </span>
                      <span className="block truncate text-[11px] text-[#9CA3AF]">
                        {account.description}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-[#6B7280]">
                        {account.email} · {account.pass}
                      </span>
                    </div>
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        isSelected ? 'bg-[#1565D8] text-white' : 'border-2 border-[#E5E7EB]'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2">
            <p className="text-[11px] text-[#9CA3AF]">
              Tip: Use any demo account to explore the portal instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}