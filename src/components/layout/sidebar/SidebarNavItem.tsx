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
  subItems,
  pathname,
}: SidebarNavItemProps & { subItems?: { name: string; href: string }[]; pathname?: string }) {
  const Icon = iconMap[icon] || LayoutDashboard;
  const [isOpen, setIsOpen] = React.useState(false);
  
  // if a subitem is active, keep this open
  React.useEffect(() => {
    if (subItems?.some(s => pathname ? pathname.startsWith(s.href) : window.location.pathname.startsWith(s.href))) {
      setIsOpen(true);
    }
  }, [subItems, pathname]);

  const hasSubItems = subItems && subItems.length > 0;
  
  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      onNavigate();
    }
  };

  const isAnySubItemActive = subItems?.some(s => pathname ? pathname.startsWith(s.href) : false);
  const mainActive = isActive || isAnySubItemActive;

  return (
    <div className="flex flex-col">
      <Link
        href={href || "#"}
        onClick={handleClick}
        className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ${
          mainActive
            ? "bg-white/[0.14] text-white ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm dark:bg-white/[0.08] dark:text-white dark:ring-white/15"
            : "text-white/85 hover:translate-x-0.5 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
        }`}
        title={compact ? name : undefined}
      >
        {mainActive && (
          <span className="absolute -left-3 rtl:left-auto rtl:-right-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-white dark:bg-[#93c5fd]" />
        )}
        <Icon
          size={18}
          className={`shrink-0 transition-transform duration-200 ${mainActive ? "drop-shadow" : "group-hover:scale-110"}`}
        />
        <span
          className={`truncate whitespace-nowrap sidebar-fade flex-1 ${compact ? "opacity-0" : "opacity-100"}`}
        >
          {name}
        </span>
        {hasSubItems && !compact && (
          <span className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
            ▶
          </span>
        )}
        {badge && badge > 0 && (
          <span
            className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30 sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
          >
            {badge}
          </span>
        )}
      </Link>
      
      {hasSubItems && isOpen && !compact && (
        <div className="mt-1 flex flex-col gap-1 pl-9 pr-2">
          {subItems.map((sub) => {
            const isSubActive = pathname ? pathname.startsWith(sub.href) : false;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onNavigate}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  isSubActive
                    ? "bg-white/[0.14] text-white ring-1 ring-white/15 dark:bg-white/[0.08] dark:text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100"
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SidebarNavItem;
