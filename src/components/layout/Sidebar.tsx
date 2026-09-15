"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarUserCard } from "./sidebar/SidebarUserCard";
import { useSidebarBehavior } from "./sidebar/useSidebarBehavior";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const {
    navRef,
    desktopCompact,
    filteredNav,
    saveNavScroll,
    handleMouseEnter,
    handleMouseLeave,
  } = useSidebarBehavior({ collapsed, role: user?.role });

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  const renderSidebarContent = (compact: boolean, isMobile = false) => (
    <div
      className={`relative flex h-full flex-col overflow-hidden bg-[#024fa7] text-white shadow-2xl shadow-[#013a7c]/40 sidebar-panel ${compact ? "w-18" : "w-60"}`}
    >
      {/* Decorative glow (kept in the dark nav area only, header stays pure white) */}
      <div className="pointer-events-none absolute bottom-10 -left-20 h-40 w-40 rounded-full bg-[#7db9ff]/20 blur-3xl" />
      {/* Logo + toggle — collapsed shows logo2 icon, expanded shows full logo */}
      <SidebarLogo
        compact={compact}
        isMobile={isMobile}
        onToggleCollapse={onToggleCollapse}
        onMobileClose={onMobileClose}
      />

      {/* Navigation — scrollbar always hidden, still scrollable */}
      <SidebarNav
        items={filteredNav}
        pathname={pathname}
        compact={compact}
        navRef={navRef}
        saveNavScroll={saveNavScroll}
        onMobileClose={onMobileClose}
      />

      {/* User profile */}
      <SidebarUserCard user={user} compact={compact} onLogout={handleLogout} />
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar (always fully expanded) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(false, true)}
      </div>

      {/* Desktop sidebar — in flex flow so the page content automatically
          resizes as the sidebar collapses/expands via the header toggle.
          When collapsed, hovering smoothly expands it (see handleMouseEnter). */}
      <div
        className="sticky top-0 hidden h-screen shrink-0 lg:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderSidebarContent(desktopCompact)}
      </div>
    </>
  );
}
