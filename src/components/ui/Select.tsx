'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

/** Synthetic change event — shape-compatible with the native select handlers
 *  already used across the app (`e.target.value`). */
export interface SelectChangeEvent {
  target: { value: string; name?: string };
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  error?: string;
  value?: string;
  defaultValue?: string | number;
  onChange?: (e: SelectChangeEvent) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
  ariaLabel?: string;
}

interface MenuPos {
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUp: boolean;
}

/**
 * Branded dropdown replacing the native `<select>` (whose OS-rendered option
 * list can't be styled, ignores dark mode, and has tiny touch targets).
 *
 * - Mobile: bottom-sheet menu with 48px touch rows + backdrop.
 * - Desktop: anchored popover under the trigger (flips upward near viewport bottom).
 * - Rendered in a portal so it's never clipped by cards/modals/overflow parents.
 * - Form-compatible: a synced invisible native select carries `name`/`required`
 *   so FormData submission and native required validation keep working with
 *   zero call-site changes.
 */
export default function Select({
  label,
  options,
  error,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  placeholder,
  size = 'md',
  className = '',
  id,
  ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId.replace(/:/g, '')}`;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState<MenuPos>({ top: 0, bottom: 0, left: 0, width: 0, openUp: false });
  const [internal, setInternal] = useState(defaultValue != null ? String(defaultValue) : '');

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
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayLabel = selected?.label ?? placeholder ?? '';
  const showPlaceholder = !selected && !!placeholder;

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.({ target: { value: next, name } });
  };

  const computePos = (): MenuPos => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + 6;
    const left = Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - (rect?.width ?? 200) - 8));
    const width = Math.max(rect?.width ?? 0, 200);
    const openUp = top + 264 > window.innerHeight && (rect?.top ?? 0) > 280;
    return { top, bottom: window.innerHeight - (rect?.top ?? 0) + 6, left, width, openUp };
  };

  const openMenu = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === current);
    setActiveIndex(idx >= 0 ? idx : 0);
    setPos(computePos());
    setOpen(true);
  };

  const closeMenu = (refocus = false) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (next: string) => {
    commit(next);
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

  // Keep the keyboard-active option visible.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    menuRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openMenu();
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex >= 0 ? activeIndex : 0];
      if (opt) choose(opt.value);
    } else if (e.key === 'Tab') {
      closeMenu();
    }
  };

  const triggerSize =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs gap-1.5'
      : 'px-4 py-2.5 text-sm gap-2 min-h-[44px] sm:min-h-0';

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
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={onTriggerKeyDown}
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] font-medium text-dark-text dark:text-gray-100 transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${triggerSize} ${error ? 'border-red-500' : ''} ${className}`}
        >
          <span className={`flex-1 truncate text-left ${showPlaceholder ? 'font-normal text-gray-400 dark:text-gray-500' : ''}`}>
            {displayLabel}
          </span>
          <ChevronDown
            size={size === 'sm' ? 14 : 16}
            className={`shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {/* Invisible native select: keeps `name` in FormData and native
            `required` validation anchored at the trigger. No pointer or tab
            interaction — the custom button owns all of that. */}
        {(name !== undefined || required) && (
          <select
            aria-hidden="true"
            tabIndex={-1}
            name={name}
            required={required}
            disabled={disabled}
            value={current}
            onChange={() => {}}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              role="listbox"
              aria-labelledby={triggerId}
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
                    {label ?? ariaLabel ?? 'Select option'}
                  </p>
                  <button
                    type="button"
                    onClick={() => closeMenu(true)}
                    aria-label="Close options"
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-blue-gray dark:hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-1.5 sm:max-h-60 sm:p-1">
                {options.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No options available
                  </p>
                ) : (
                  options.map((opt, i) => {
                    const isSel = opt.value === current;
                    const isActive = i === activeIndex;
                    return (
                      <button
                        key={`${opt.value}-${i}`}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        data-active={isActive}
                        onClick={() => choose(opt.value)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2 ${
                          isActive ? 'bg-blue-gray/70 dark:bg-white/10' : ''
                        } ${isSel ? 'font-semibold text-teal' : 'text-dark-text dark:text-gray-100'}`}
                      >
                        <span className="flex-1 truncate">{opt.label}</span>
                        {isSel && <Check size={16} className="shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
