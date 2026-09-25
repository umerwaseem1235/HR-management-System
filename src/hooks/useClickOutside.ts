"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Calls `onOutside` when a pointer-down happens outside `ref`.
 * Single shared source — topbar re-exports this hook.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  active = true,
) {
  const handlerRef = useRef(onOutside);
  // Sync without writing the ref during render (react-hooks/refs).
  useEffect(() => {
    handlerRef.current = onOutside;
  });

  useEffect(() => {
    if (!active) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handlerRef.current();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, active]);
}

export default useClickOutside;
