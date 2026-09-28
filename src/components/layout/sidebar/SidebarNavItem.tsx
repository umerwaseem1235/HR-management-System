"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { iconMap } from "./iconMap";

interface SidebarNavItemProps {
  href: string;
  name: string;
  icon: string;
  badge?: number;
  isActive: boolean;
  compact: boolean;
  onNavigate: () => void;
}

export function SidebarNavItem({
  href,
  name,
  icon,
  badge,
  isActive,
  compact,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = iconMap[icon] || LayoutDashboard;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={name}
      className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
        isActive
          ? "bg-[#0265cc] text-white shadow-lg shadow-[#012f66]/40"
          : "text-white hover:bg-[#6aa9f5]/25 hover:text-white"
      }`}
      title={compact ? name : undefined}
    >
      {isActive && (
        <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#9cc9ff]" />
      )}
      <Icon
        size={18}
        aria-hidden
        className={`shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
      />
      <span
        aria-hidden={compact}
        className={`min-w-0 flex-1 truncate whitespace-nowrap sidebar-fade transition-all duration-300 ease-in-out ${
          compact
            ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
            : "max-w-full opacity-100 delay-200"
        }`}
      >
        {name}
      </span>
      {badge && badge > 0 && (
        <span
          aria-hidden={compact}
          className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold tabular-nums text-white shadow-sm ring-1 ring-white/30 sidebar-fade transition-all duration-300 ease-in-out ${
            compact
              ? "pointer-events-none max-w-0 overflow-hidden border-0 px-0 opacity-0"
              : "opacity-100 delay-200"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export default SidebarNavItem;
