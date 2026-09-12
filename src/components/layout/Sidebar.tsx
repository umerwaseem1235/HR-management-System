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
  hoverLock: boolean;
}

export default function Sidebar({ mobileOpen, onMobileClose, hoverLock }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Temporary hover expansion (desktop only): the sidebar stays compact
  // and smoothly expands to full width while hovered (frozen while locked).
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
      className={`relative flex h-full flex-col overflow-hidden bg-[#024fa7] text-white shadow-2xl shadow-[#013a7c]/40 sidebar-panel ${compact ? "w-18" : "w-60"}`}
    >
      {/* Decorative glow (kept in the dark nav area only, header stays pure white) */}
      <div className="pointer-events-none absolute bottom-10 -left-20 h-40 w-40 rounded-full bg-[#7db9ff]/20 blur-3xl" />
      {/* Logo — white band continuous with the top navbar */}
      <div
        className="flex h-16 shrink-0 items-center justify-center overflow-hidden border-b border-[#D6E4E8]/70 bg-[#ffffff] px-4"
      >
        {compact ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0265cc] shadow-lg shadow-[#013a7c]/50 ring-1 ring-white/30">
            <Building2 size={20} className="text-white drop-shadow-sm" />
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-center">
            <img src="/logo.jpg" alt="CodQor Technologies" className="h-24 w-auto max-w-none object-contain" />
          </div>
        )}
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
              className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-[#0265cc] text-white shadow-lg shadow-[#012f66]/40"
                  : "text-white hover:translate-x-0.5 hover:bg-[#6aa9f5]/25 hover:text-white"
              }`}
              title={compact ? item.name : undefined}
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
                {item.name}
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30 sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="shrink-0 p-2.5">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="relative shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0265cc] text-xs font-bold shadow-md ring-2 ring-white/30">
                {user.avatar ||
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#024fa7] bg-green-400" />
            </span>
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-white">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <button
                onClick={logout}
                className="shrink-0 rounded-lg p-1.5 text-white transition-colors hover:bg-red-500/20 hover:text-red-300"
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
          resizes as the sidebar expands/collapses on hover (frozen while locked) */}
      <div
        className="sticky top-0 hidden h-screen shrink-0 lg:block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {renderSidebarContent(hoverLock ? false : !hovered)}
      </div>
    </>
  );
}
