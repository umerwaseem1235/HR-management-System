'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerChangeEvent {
  target: { value: string; name?: string };
}

interface DatePickerProps {
  /** Selected date as 'YYYY-MM-DD'. Empty string = nothing selected. */
  value?: string;
  defaultValue?: string | number;
  onChange?: (e: DatePickerChangeEvent) => void;
  label?: string;
  error?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Bounds as 'YYYY-MM-DD'. Out-of-range days are disabled. */
  min?: string;
  max?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDate(v: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dim = new Date(year, month, 0).getDate();
  if (day > dim) return null;
  return { year, month, day };
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function fmtDisplay(v: string): string {
  const p = parseDate(v);
  if (!p) return '';
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`;
}

function todayKey(): string {
  const n = new Date();
  return toKey(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function shiftKey(key: string, days: number): string {
  const p = parseDate(key);
  if (!p) return key;
  const d = new Date(p.year, p.month - 1, p.day + days);
  return toKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

interface MenuPos {
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUp: boolean;
}

interface DayCell {
  key: string;
  day: number;
  inMonth: boolean;
}

/**
 * Branded date picker replacing `<input type="date">` (whose OS-rendered
 * calendar popup can't be styled and breaks out of cards on small screens).
 *
 * - Mobile: bottom-sheet calendar with large touch targets + backdrop.
 * - Desktop: anchored popover under the trigger (flips upward near viewport bottom).
 * - Portaled to body so it's never clipped by cards/modals/overflow parents.
 * - Form-compatible: a synced invisible native input carries `name`/`required`
 *   so FormData submission and native required validation keep working with
 *   zero call-site changes.
 */
export default function DatePicker({
  value,
  defaultValue,
  onChange,
  label,
  error,
  name,
  required,
  disabled,
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  className = '',
  id,
  ariaLabel,
}: DatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? `datepicker-${generatedId.replace(/:/g, '')}`;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue != null ? String(defaultValue) : '');
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
  const [activeKey, setActiveKey] = useState('');
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

  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const display = fmtDisplay(current);
  const showPlaceholder = !display;
  const today = todayKey();

  const isDisabledDay = (key: string): boolean => {
    if (disabled) return true;
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  };

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.({ target: { value: next, name } });
  };

  const computePos = (): MenuPos => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + 6;
    // Clamp with the MENU width (not the trigger width) so the popup never
    // runs off the right edge when the field sits near it.
    const width = Math.min(Math.max(rect?.width ?? 0, 280), window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - width - 8));
    const openUp = top + 380 > window.innerHeight && (rect?.top ?? 0) > 400;
    return { top, bottom: window.innerHeight - (rect?.top ?? 0) + 6, left, width, openUp };
  };

  const openMenu = () => {
    if (disabled) return;
    const p = parseDate(current);
    const vy = p?.year ?? new Date().getFullYear();
    const vm = p?.month ?? new Date().getMonth() + 1;
    setViewYear(vy);
    setViewMonth(vm);
    setActiveKey(p ? current : today);
    setPos(computePos());
    setOpen(true);
  };

  const closeMenu = (refocus = false) => {
    setOpen(false);
    setActiveKey('');
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (key: string) => {
    if (isDisabledDay(key)) return;
    commit(key);
    closeMenu(true);
  };

  const moveView = (delta: number) => {
    let y = viewYear;
    let m = viewMonth + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setViewYear(y);
    setViewMonth(m);
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

  // Measured flip: after the menu paints (and whenever the viewed month
  // changes its row count), check the real height against the viewport and
  // flip upward if it overflows but fits above the trigger. This guarantees
  // the whole calendar is visible without scrolling at any zoom level.
  useEffect(() => {
    if (!open || !mounted) return;
    const frame = requestAnimationFrame(() => {
      const h = menuRef.current?.offsetHeight ?? 0;
      if (!h) return;
      const triggerTop = triggerRef.current?.getBoundingClientRect().top ?? 0;
      setPos((p) => {
        const overflows = p.top + h > window.innerHeight - 8;
        const fitsAbove = triggerTop - h - 8 > 8;
        if (!p.openUp && overflows && fitsAbove) return { ...p, openUp: true };
        if (p.openUp && !fitsAbove && !overflows) return { ...p, openUp: false };
        return p;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mounted, viewYear, viewMonth ]);

  const stepActive = (days: number) => {
    const base = activeKey || today;
    const next = shiftKey(base, days);
    const p = parseDate(next);
    if (!p) return;
    setActiveKey(next);
    if (p.year !== viewYear || p.month !== viewMonth) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openMenu();
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepActive(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stepActive(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepActive(7); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepActive(-7); }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeKey && !isDisabledDay(activeKey)) choose(activeKey); }
    else if (e.key === 'Tab') { closeMenu(); }
  };

  // Calendar grid for the viewed month — only as many week rows as needed
  // (4–6), so short months don't force empty space that overflows small screens.
  const cells: DayCell[] = (() => {
    const first = new Date(viewYear, viewMonth - 1, 1).getDay();
    const dim = new Date(viewYear, viewMonth, 0).getDate();
    const prevDim = new Date(viewYear, viewMonth - 1, 0).getDate();
    const out: DayCell[] = [];
    for (let i = first - 1; i >= 0; i--) {
      const d = prevDim - i;
      const m = viewMonth === 1 ? 12 : viewMonth - 1;
      const y = viewMonth === 1 ? viewYear - 1 : viewYear;
      out.push({ key: toKey(y, m, d), day: d, inMonth: false });
    }
    for (let d = 1; d <= dim; d++) out.push({ key: toKey(viewYear, viewMonth, d), day: d, inMonth: true });
    let next = 1;
    while (out.length % 7 !== 0) {
      const m = viewMonth === 12 ? 1 : viewMonth + 1;
      const y = viewMonth === 12 ? viewYear + 1 : viewYear;
      out.push({ key: toKey(y, m, next), day: next, inMonth: false });
      next += 1;
    }
    return out;
  })();

  return (
    <div ref={rootRef} className="w-full">
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-sm font-medium text-dark-text dark:text-gray-100 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
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
          className={`flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-4 py-2.5 text-sm font-medium text-dark-text dark:text-gray-100 transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 ${error ? 'border-red-500' : ''} ${className}`}
        >
          <CalendarDays size={16} className="shrink-0 text-teal" />
          <span className={`flex-1 truncate text-left tabular-nums ${showPlaceholder ? 'font-normal text-gray-400 dark:text-gray-500' : ''}`}>
            {showPlaceholder ? placeholder : display}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {/* Invisible native input: keeps `name` in FormData and native
            `required` validation anchored at the trigger. No pointer or tab
            interaction — the custom button owns all of that. */}
        {(name !== undefined || required) && (
          <input
            aria-hidden="true"
            tabIndex={-1}
            type="date"
            name={name}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            value={current}
            onChange={() => {}}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {mounted &&
        open &&
        createPortal(
          <>
            {/* Mobile backdrop — desktop closes via outside pointer-down */}
            <div className="fixed inset-0 z-[60] bg-black/40 sm:hidden" onClick={() => closeMenu()} />
            <div
              ref={menuRef}
              role="dialog"
              aria-label={ariaLabel ?? label ?? 'Choose date'}
              onKeyDown={onMenuKeyDown}
              style={
                {
                  '--menu-top': `${pos.top}px`,
                  '--menu-bottom': `${pos.bottom}px`,
                  '--menu-left': `${pos.left}px`,
                  '--menu-width': `${pos.width}px`,
                } as React.CSSProperties
              }
              className={`fixed inset-x-3 bottom-3 z-[70] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-2xl bg-white dark:bg-[#1b263b] shadow-2xl ring-1 ring-black/10 sm:inset-x-auto sm:w-[var(--menu-width)] sm:rounded-xl sm:left-[var(--menu-left)] ${
                pos.openUp ? 'sm:top-auto sm:bottom-[var(--menu-bottom)]' : 'sm:bottom-auto sm:top-[var(--menu-top)]'
              }`}
            >
              {/* Bottom-sheet header — mobile only */}
              <div className="sm:hidden">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-medium-gray" />
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                  <p className="text-sm font-semibold text-primary dark:text-blue-gray-light">
                    {ariaLabel ?? label ?? 'Choose date'}
                  </p>
                  <button
                    type="button"
                    onClick={() => closeMenu(true)}
                    aria-label="Close calendar"
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-blue-gray dark:hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-3">
                {/* Month navigator */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-bold text-primary dark:text-blue-gray-light">
                    {MONTHS[viewMonth - 1]} {viewYear}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => moveView(-1)}
                      className="rounded-lg p-2.5 text-dark-text dark:text-gray-100 hover:bg-blue-gray dark:hover:bg-white/10 sm:p-2"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => moveView(1)}
                      className="rounded-lg p-2.5 text-dark-text dark:text-gray-100 hover:bg-blue-gray dark:hover:bg-white/10 sm:p-2"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Weekday header */}
                <div className="grid grid-cols-7 text-center">
                  {WEEKDAYS.map((w) => (
                    <p key={w} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {w}
                    </p>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1" role="listbox" aria-label="Days">
                  {cells.map((c) => {
                    const isSel = c.key === current;
                    const isToday = c.key === today;
                    const isActive = c.key === activeKey;
                    const dis = isDisabledDay(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        disabled={dis}
                        onClick={() => choose(c.key)}
                        onMouseEnter={() => setActiveKey(c.key)}
                        onFocus={() => setActiveKey(c.key)}
                        className={`flex min-h-[44px] items-center justify-center rounded-xl text-sm tabular-nums transition-colors sm:min-h-0 sm:rounded-lg sm:py-1.5 ${
                          isSel
                            ? 'bg-teal font-bold text-white shadow-md'
                            : dis
                              ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                              : isActive
                                ? 'bg-blue-gray/70 dark:bg-white/10 font-semibold text-dark-text dark:text-gray-100'
                                : c.inMonth
                                  ? 'font-medium text-dark-text dark:text-gray-100 hover:bg-blue-gray/70 dark:hover:bg-white/10'
                                  : 'text-gray-400 dark:text-gray-500 hover:bg-blue-gray/70 dark:hover:bg-white/10'
                        } ${!isSel && isToday ? 'ring-1 ring-inset ring-teal/60 font-bold' : ''}`}
                      >
                        {c.day}
                      </button>
                    );
                  })}
                </div>

                {/* Footer shortcuts */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { commit(''); closeMenu(true); }}
                    className="flex-1 rounded-xl border border-medium-gray py-2.5 text-xs font-semibold text-dark-text dark:text-gray-100 hover:bg-blue-gray/60 dark:hover:bg-white/5 transition-colors sm:py-2"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!isDisabledDay(today)) choose(today); }}
                    className="flex-1 rounded-xl border border-medium-gray py-2.5 text-xs font-semibold text-teal hover:bg-blue-gray/60 dark:hover:bg-white/5 transition-colors sm:py-2"
                  >
                    Today
                  </button>
                </div>
              </div>
              <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
