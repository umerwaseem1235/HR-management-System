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
      className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
        isActive
          ? "bg-[#0265cc] text-white shadow-lg shadow-[#012f66]/40"
          : "text-white hover:translate-x-0.5 hover:bg-[#6aa9f5]/25 hover:text-white"
      }`}
      title={compact ? name : undefined}
    >
      {isActive && (
        <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#9cc9ff]" />
      )}
      <Icon
        size={18}
        className={`shrink-0 transition-transform duration-200 ${isActive ? "drop-shadow" : "group-hover:scale-110"}`}
      />
      <span
        className={`truncate whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
      >
        {name}
      </span>
      {badge && badge > 0 && (
        <span
          className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30 sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export default SidebarNavItem;
