"use client";

import React, { type RefObject } from "react";
import type { NavItem } from "../../../lib/types";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarNavProps {
  items: NavItem[];
  pathname: string;
  compact: boolean;
  navRef: RefObject<HTMLElement | null>;
  saveNavScroll: () => void;
  onMobileClose: () => void;
}

export function SidebarNav({
  items,
  pathname,
  compact,
  navRef,
  saveNavScroll,
  onMobileClose,
}: SidebarNavProps) {
  return (
    <nav
      ref={navRef}
      className="sidebar-scroll flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            name={item.name}
            icon={item.icon}
            badge={item.badge}
            isActive={isActive}
            compact={compact}
            onNavigate={() => {
              saveNavScroll();
              onMobileClose();
            }}
          />
        );
      })}
    </nav>
  );
}

export default SidebarNav;
