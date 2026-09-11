"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Wallet,
  TrendingUp,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { NAVIGATION, ROLE_LABELS } from "../../lib/constants";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Wallet,
  TrendingUp,
  Receipt,
  FileText,
  BarChart3,
  Settings,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Temporary hover expansion (desktop only): the sidebar stays compact
  // and smoothly expands to full width while hovered.
  const [hovered, setHovered] = useState(false);

  // Persist sidebar scroll position across page navigations (the sidebar
  // remounts on route change, which would otherwise reset it to the top)
  const saveNavScroll = () => {
    try {
      if (navRef.current)
        sessionStorage.setItem(
          "hrms_sidebar_scroll",
          String(navRef.current.scrollTop),
        );
    } catch {
      // Storage unavailable — ignore
    }
  };

  // Restore before paint so there is no visible jump back to the top
  useLayoutEffect(() => {
    try {
      const saved = sessionStorage.getItem("hrms_sidebar_scroll");
      const pos = saved ? parseInt(saved, 10) : 0;
      if (navRef.current && !isNaN(pos) && pos > 0) {
        navRef.current.scrollTop = pos;
      }
    } catch {
      // Storage unavailable — stay at top
    }
  }, []);

  // Auto-hide scroller: show only while the user is actively scrolling
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.add("is-scrolling");
      saveNavScroll();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => nav.classList.remove("is-scrolling"),
        900,
      );
    };
    nav.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      nav.removeEventListener("scroll", onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!user) return null;

  const filteredNav = NAVIGATION.filter((item) =>
    item.roles.includes(user.role),
  );

  // `compact` drives all visuals (width, labels). Desktop passes `!hovered`
  // so hovering temporarily expands the sidebar; mobile always renders
  // fully expanded.
  const renderSidebarContent = (compact: boolean) => (
    <div
      className={`relative flex h-full flex-col overflow-hidden bg-linear-to-b from-[#1a3a5c] via-primary to-[#0d1f33] text-white shadow-2xl shadow-[#0d1f33]/40 sidebar-panel ${compact ? "w-19" : "w-66"}`}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-teal/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-40 w-40 rounded-full bg-teal/15 blur-3xl" />
      {/* Top accent line */}
      <div className="h-1 w-full shrink-0 bg-linear-to-r from-teal via-[#2dd4bf] to-teal" />

      {/* Logo */}
      <div
        className={`flex h-16 shrink-0 items-center px-4 ${compact ? "justify-center" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#14b8a6] via-teal to-[#0b5e5f] shadow-lg shadow-teal/50 ring-1 ring-white/30">
            <Building2 size={20} className="text-white drop-shadow-sm" />
          </div>
          <div
            className={`min-w-0 overflow-hidden whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
          >
            <h1 className="truncate bg-linear-to-r from-white via-white to-[#99f6e4] bg-clip-text text-[18px] font-extrabold tracking-tight text-transparent">
              CodeQor
            </h1>
            <span className="mt-1.5 inline-flex items-center rounded-md bg-teal/30 px-2 py-0.75 text-[9px] font-bold uppercase tracking-[0.24em] text-[#5eead4] ring-1 ring-inset ring-[#5eead4]/40">
              HRMS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation — scrollbar sits on the left edge, shows only while scrolling */}
      <nav
        ref={navRef}
        className="sidebar-scroll flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        {filteredNav.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                saveNavScroll();
                onMobileClose();
              }}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-linear-to-r from-teal to-[#14a8a0] text-white shadow-lg shadow-teal/30"
                  : "text-white/60 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
              }`}
              title={compact ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#5eead4]" />
              )}
              <Icon
                size={20}
                className={`shrink-0 transition-transform duration-200 ${isActive ? "drop-shadow" : "group-hover:scale-110"}`}
              />
              <span
                className={`truncate whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
              >
                {item.name}
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30 sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="shrink-0 p-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="relative shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-teal to-[#14b8a6] text-sm font-bold shadow-md ring-2 ring-white/30">
                {user.avatar ||
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-green-400" />
            </span>
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-[11px] text-white/50">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <button
                onClick={logout}
                className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
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
        {renderSidebarContent(false)}
      </div>

      {/* Desktop sidebar — in flex flow so the page content automatically
          resizes as the sidebar expands/collapses on hover */}
      <div
        className="sticky top-0 hidden h-screen shrink-0 lg:block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {renderSidebarContent(!hovered)}
      </div>
    </>
  );
}
