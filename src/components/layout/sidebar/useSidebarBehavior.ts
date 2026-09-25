"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAVIGATION } from "../../../lib/constants";
import type { UserRole } from "../../../lib/types";

const SCROLL_STORAGE_KEY = "hrms_sidebar_scroll";

interface UseSidebarBehaviorArgs {
  collapsed: boolean;
  role: UserRole | undefined;
}

export function useSidebarBehavior({ collapsed, role }: UseSidebarBehaviorArgs) {
  const navRef = useRef<HTMLElement>(null);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hover-to-expand: when the sidebar is collapsed (desktop), hovering
  // temporarily expands it. The width animates via .sidebar-panel
  // (300ms ease-in-out). A short close delay avoids flicker.
  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    if (collapsed) setHoverExpanded(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoverExpanded(false), 120);
  };

  // Derive the pinned-open state during render instead of syncing it in an
  // effect: when the sidebar is pinned open, hover-expansion is always off.
  // (Same committed output as the previous effect, without a cascading render.)
  if (!collapsed && hoverExpanded) {
    setHoverExpanded(false);
  }

  useEffect(() => {
    // If user pins it open via toggle, cancel any pending hover-close
    if (!collapsed) {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    }
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [collapsed]);

  // Persist sidebar scroll position across page navigations (the sidebar
  // remounts on route change, which would otherwise reset it to the top)
  const saveNavScroll = () => {
    try {
      if (navRef.current)
        sessionStorage.setItem(
          SCROLL_STORAGE_KEY,
          String(navRef.current.scrollTop),
        );
    } catch {
      // Storage unavailable — ignore
    }
  };

  // Restore before paint so there is no visible jump back to the top
  useLayoutEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      const pos = saved ? parseInt(saved, 10) : 0;
      if (navRef.current && !isNaN(pos) && pos > 0) {
        navRef.current.scrollTop = pos;
      }
    } catch {
      // Storage unavailable — stay at top
    }
  }, []);

  // Persist scroll position only — scrollbar stays hidden (see .sidebar-scroll)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      saveNavScroll();
    };
    nav.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      nav.removeEventListener("scroll", onScroll);
    };
  }, []);

  const filteredNav = role
    ? NAVIGATION.filter((item) => item.roles.includes(role))
    : [];

  // `compact` drives all visuals (width, labels). On desktop it is the
  // pinned `collapsed` state, temporarily overridden while hovering so the
  // sidebar opens smoothly and closes again on mouse-leave.
  const desktopCompact = collapsed && !hoverExpanded;

  return {
    navRef,
    hoverExpanded,
    desktopCompact,
    filteredNav,
    saveNavScroll,
    handleMouseEnter,
    handleMouseLeave,
  };
}

export default useSidebarBehavior;
