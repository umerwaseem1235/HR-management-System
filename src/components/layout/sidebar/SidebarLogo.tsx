"use client";

import React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";

interface SidebarLogoProps {
  compact: boolean;
  isMobile?: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

export function SidebarLogo({
  compact,
  isMobile = false,
  onToggleCollapse,
  onMobileClose,
}: SidebarLogoProps) {
  return (
    <div
      className={`relative flex flex-row rtl:flex-row-reverse h-16 shrink-0 items-center overflow-hidden border-b border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/[0.03] ${compact && !isMobile ? "justify-center px-1" : "justify-between gap-2 pl-1 pr-2"}`}
    >
      {compact && !isMobile ? (
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm outline-none transition-transform duration-200 hover:scale-105 hover:border-[#024fa7]/30 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <Image src="/logo2.jpg" alt="CodQor" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
        </button>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center justify-start overflow-hidden">
            <Image src="/logo.jpg" alt="CodQor Technologies" width={160} height={80} className="-ml-2 h-20 w-auto max-w-[160px] object-contain object-left" />
          </div>
          <button
            onClick={isMobile ? onMobileClose : onToggleCollapse}
            title={isMobile ? "Close sidebar" : "Collapse sidebar"}
            aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 outline-none transition-all duration-200 hover:border-[#024fa7]/30 hover:bg-[#024fa7]/5 hover:text-[#024fa7] active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:hover:text-white"
          >
            <Menu size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export default SidebarLogo;
