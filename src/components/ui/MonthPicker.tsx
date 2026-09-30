'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthPickerProps {
  /** Selected month as 'YYYY-MM'. Empty string = nothing selected. */
  value: string;
  onChange: (v: string) => void;
  label?: string;
  /** Shown when nothing is selected, e.g. 'All months'. */
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseYearMonth(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), month };
}

function fmtLabel(v: string): string {
  const p = parseYearMonth(v);
  if (!p) return '';
  return `${MONTHS[p.month - 1]} ${p.year}`;
}

interface MenuPos {
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUp: boolean;
}

/**
 * Branded month picker replacing `<input type="month">` (whose OS-rendered
 * popup can't be styled and is unusable on small screens).
 *
 * - Mobile: bottom-sheet with a large 3-column month grid + backdrop.
 * - Desktop: anchored popover under the trigger (flips upward near viewport bottom).
 * - Portaled to body so it's never clipped by cards/modals/overflow parents.
 */
export default function MonthPicker({
  value,
  onChange,
  label,
  placeholder,
  ariaLabel,
  disabled,
  className = '',
  id,
  minYear = 2000,
  maxYear,
}: MonthPickerProps) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const upperYear = maxYear ?? thisYear + 10;

  const generatedId = useId();
  const triggerId = id ?? `monthpicker-${generatedId.replace(/:/g, '')}`;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => parseYearMonth(value)?.year ?? thisYear);
  const [activeMonth, setActiveMonth] = useState(-1);
  const [pos, setPos] = useState<MenuPos>({ top: 0, bottom: 0, left: 0, width: 0, openUp: false });

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Portal target must wait for client mount (SSR has no document).
  // Deferred via rAF so no setState runs synchronously in the effect body.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const selected = parseYearMonth(value);
  const display = selected ? fmtLabel(value) : (placeholder ?? 'Select month');
  const showPlaceholder = !selected;

  const computePos = (): MenuPos => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + 6;
    const left = Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - (rect?.width ?? 240) - 8));
    const width = Math.max(rect?.width ?? 0, 240);
    const openUp = top + 340 > window.innerHeight && (rect?.top ?? 0) > 360;
    return { top, bottom: window.innerHeight - (rect?.top ?? 0) + 6, left, width, openUp };
  };

  const openMenu = () => {
    if (disabled) return;
    setYear(selected?.year ?? thisYear);
    setActiveMonth(selected ? selected.month : -1);
    setPos(computePos());
    setOpen(true);
  };

  const closeMenu = (refocus = false) => {
    setOpen(false);
    setActiveMonth(-1);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (month: number) => {
    onChange(`${year}-${String(month).padStart(2, '0')}`);
    closeMenu(true);
  };

  const goThisMonth = () => {
    setYear(thisYear);
    onChange(`${thisYear}-${String(thisMonth).padStart(2, '0')}`);
    closeMenu(true);
  };

  // Close on outside pointer-down, Escape, or viewport scroll/resize.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      closeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      closeMenu();
    };
    const onResize = () => closeMenu();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open ]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openMenu();
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveMonth((m) => (m >= 12 ? 1 : m <= 0 ? 1 : Math.min(12, m + 1)));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveMonth((m) => (m <= 1 ? 12 : m <= 0 ? 12 : m - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveMonth((m) => (m <= 0 ? 1 : Math.min(12, m + 3)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveMonth((m) => (m <= 0 ? 12 : Math.max(1, m - 3)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeMonth >= 1) choose(activeMonth);
    } else if (e.key === 'Tab') {
      closeMenu();
    }
  };

  const canPrev = year > minYear;
  const canNext = year < upperYear;

  return (
    <div ref={rootRef} className="w-full">
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-sm font-medium text-dark-text dark:text-gray-100 mb-1.5"
        >
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-4 py-2.5 text-sm font-medium text-dark-text dark:text-gray-100 transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 ${className}`}
      >
        <CalendarDays size={16} className="shrink-0 text-teal" />
        <span className={`flex-1 truncate text-left ${showPlaceholder ? 'font-normal text-gray-400 dark:text-gray-500' : ''}`}>
          {display}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <>
            {/* Mobile backdrop — desktop closes via outside pointer-down */}
            <div className="fixed inset-0 z-[60] bg-black/40 sm:hidden" onClick={() => closeMenu()} />
            <div
              ref={menuRef}
              role="dialog"
              aria-label={ariaLabel ?? label ?? 'Choose month'}
              onKeyDown={onMenuKeyDown}
              style={
                {
                  '--menu-top': `${pos.top}px`,
                  '--menu-bottom': `${pos.bottom}px`,
                  '--menu-left': `${pos.left}px`,
                  '--menu-width': `${pos.width}px`,
                } as React.CSSProperties
              }
              className={`fixed inset-x-3 bottom-3 z-[70] overflow-hidden rounded-2xl bg-white dark:bg-[#1b263b] shadow-2xl ring-1 ring-black/10 sm:inset-x-auto sm:w-[var(--menu-width)] sm:rounded-xl sm:left-[var(--menu-left)] ${
                pos.openUp ? 'sm:top-auto sm:bottom-[var(--menu-bottom)]' : 'sm:bottom-auto sm:top-[var(--menu-top)]'
              }`}
            >
              {/* Bottom-sheet header — mobile only */}
              <div className="sm:hidden">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-medium-gray" />
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                  <p className="text-sm font-semibold text-primary dark:text-blue-gray-light">
                    {ariaLabel ?? label ?? 'Choose month'}
                  </p>
                  <button
                    type="button"
                    onClick={() => closeMenu(true)}
                    aria-label="Close month picker"
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-blue-gray dark:hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-3">
                {/* Year navigator */}
                <div className="mb-3 flex items-center justify-between rounded-xl bg-blue-gray/60 dark:bg-white/5 px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="Previous year"
                    disabled={!canPrev}
                    onClick={() => canPrev && setYear((y) => y - 1)}
                    className="rounded-lg p-2.5 text-dark-text dark:text-gray-100 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <p className="text-base font-bold tabular-nums text-primary dark:text-blue-gray-light">{year}</p>
                  <button
                    type="button"
                    aria-label="Next year"
                    disabled={!canNext}
                    onClick={() => canNext && setYear((y) => y + 1)}
                    className="rounded-lg p-2.5 text-dark-text dark:text-gray-100 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-1.5" role="listbox" aria-label="Months">
                  {MONTHS.map((m, i) => {
                    const month = i + 1;
                    const isSel = selected?.year === year && selected?.month === month;
                    const isCurrent = year === thisYear && month === thisMonth;
                    const isActive = month === activeMonth;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        onClick={() => choose(month)}
                        onMouseEnter={() => setActiveMonth(month)}
                        onFocus={() => setActiveMonth(month)}
                        className={`flex min-h-[48px] items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-sm transition-colors sm:min-h-0 sm:rounded-lg sm:py-2 ${
                          isSel
                            ? 'bg-teal font-bold text-white shadow-md'
                            : isActive
                              ? 'bg-blue-gray/70 dark:bg-white/10 font-medium text-dark-text dark:text-gray-100'
                              : 'font-medium text-dark-text dark:text-gray-100 hover:bg-blue-gray/70 dark:hover:bg-white/10'
                        } ${!isSel && isCurrent ? 'ring-1 ring-inset ring-teal/50' : ''}`}
                      >
                        <span className="truncate">{m}</span>
                        {isSel && <Check size={14} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Footer shortcut */}
                <button
                  type="button"
                  onClick={goThisMonth}
                  className="mt-3 w-full rounded-xl border border-medium-gray py-2.5 text-xs font-semibold text-teal hover:bg-blue-gray/60 dark:hover:bg-white/5 transition-colors sm:py-2"
                >
                  This month
                </button>
              </div>
              <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
