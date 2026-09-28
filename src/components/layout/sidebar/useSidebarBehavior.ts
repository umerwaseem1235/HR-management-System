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

  // Hover-to-expand: when the sidebar is collapsed (desktop), resting the
  // cursor on it briefly expands it. The width animates via .sidebar-panel
  // (300ms ease-in-out). Expansion waits 220ms for genuine hover intent, so
  // merely sweeping the cursor across the screen edge no longer fires a full
  // expand/collapse cycle (that flicker reads as glitching/"buffering",
  // especially noticeable with a modal open). A short close delay avoids
  // flicker when moving between sidebar and content.
  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    if (collapsed && !hoverExpanded) {
      hoverTimeout.current = setTimeout(() => {
        hoverTimeout.current = null;
        setHoverExpanded(true);
      }, 220);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    hoverTimeout.current = setTimeout(() => {
      hoverTimeout.current = null;
      setHoverExpanded(false);
    }, 120);
  };

  useEffect(() => {
    // When pinned open, hover-expansion is always off. Synced in an effect
    // (not during render) so toggling never causes a render-loop flicker
    // that ghosts sidebar text.
    if (!collapsed && hoverExpanded) {
      setHoverExpanded(false);
    }
    // If user pins it open via toggle, cancel any pending hover-close
    if (!collapsed) {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    }
  }, [collapsed, hoverExpanded]);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

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
