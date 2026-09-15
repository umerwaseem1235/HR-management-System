'use client';

import React from 'react';

/* ---------- Professional numeric input: backspace clears, type fresh ---------- */
export default function NumberField({ value, onCommit, step = 'any', min = 0, className = '', placeholder }: {
  value: number;
  onCommit: (n: number) => void;
  step?: string;
  min?: number;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const display = draft ?? String(value ?? 0);

  return (
    <input
      type="number"
      min={min}
      step={step}
      value={display}
      placeholder={placeholder}
      onFocus={e => e.target.select()}
      onChange={e => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === '') return; // let user clear with backspace, commit on blur / next type
        const n = Number(raw);
        if (!Number.isNaN(n)) onCommit(n);
      }}
      onBlur={() => {
        if (draft !== null) {
          if (draft === '' || Number.isNaN(Number(draft))) onCommit(0);
          setDraft(null);
        }
      }}
      className={className}
    />
  );
}
