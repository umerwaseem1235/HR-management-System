"use client";

import React, { type RefObject } from "react";
import type { NavItem } from "../../../lib/types";
import { SidebarNavItem } from "./SidebarNavItem";
import { useNavTranslation } from "./useNavTranslation";

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
  const tNav = useNavTranslation();

  return (
    <nav
      ref={navRef}
      className="sidebar-scroll flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const isActive =
          item.href ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false;

        // Translate sub-item names too
        const translatedSubItems = item.subItems?.map(sub => ({
          ...sub,
          name: tNav(sub.name),
        }));

        return (
          <SidebarNavItem
            key={item.name}
            href={item.href || ""}
            name={tNav(item.name)}
            icon={item.icon}
            badge={item.badge}
            isActive={isActive}
            compact={compact}
            subItems={translatedSubItems}
            pathname={pathname}
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
