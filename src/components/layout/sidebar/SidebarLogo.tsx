"use client";

import React from "react";
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
      className={`flex h-16 shrink-0 items-center overflow-hidden border-b border-[#D6E4E8]/70 bg-[#ffffff] ${compact && !isMobile ? "justify-center px-1" : "justify-between gap-2 pl-1 pr-2"}`}
    >
      {compact && !isMobile ? (
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white outline-none transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <img src="/logo2.jpg" alt="CodQor" className="h-8 w-8 object-contain" />
        </button>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center justify-start overflow-hidden">
            <img src="/logo.jpg" alt="CodQor Technologies" className="-ml-2 h-20 w-auto max-w-[160px] object-contain object-left" />
          </div>
          <button
            onClick={isMobile ? onMobileClose : onToggleCollapse}
            title={isMobile ? "Close sidebar" : "Collapse sidebar"}
            aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-0 bg-white text-black outline-none transition-all duration-200 hover:bg-gray-100 active:scale-95"
          >
            <Menu size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export default SidebarLogo;
