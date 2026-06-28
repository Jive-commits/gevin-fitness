'use client';

import { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  label,
  size = 'md',
  emberWhenSet = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  label?: string;
  size?: 'md' | 'lg';
  emberWhenSet?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const round = (n: number) => {
    const p = step < 1 ? 100 : 1;
    return Math.round(n * p) / p;
  };

  function bump(dir: number) {
    const base = value ?? 0;
    onChange(clamp(round(base + dir * step)));
  }

  function commitDraft() {
    setEditing(false);
    const cleaned = draft.replace(',', '.').trim();
    if (cleaned === '') {
      onChange(null);
      return;
    }
    const n = parseFloat(cleaned);
    onChange(Number.isNaN(n) ? value : clamp(round(n)));
  }

  const display = value === null ? '—' : Number.isInteger(value) ? `${value}` : value.toFixed(step < 1 ? 1 : 0);
  const big = size === 'lg';

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[10px] font-medium uppercase tracking-wide text-text-faint">{label}</span>}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label={`Decrease ${label ?? ''}`}
          className={cn(
            'tap grid place-items-center rounded-xl surface-2 border border-border text-text-dim active:text-text',
            big ? 'h-12 w-12' : 'h-11 w-11',
          )}
        >
          <Minus size={big ? 22 : 18} />
        </button>

        <div
          className={cn(
            'grid place-items-center rounded-xl',
            big ? 'h-14 min-w-[92px] px-2' : 'h-12 min-w-[64px] px-1',
          )}
        >
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDraft();
                if (e.key === 'Escape') setEditing(false);
              }}
              className={cn(
                'num w-full bg-transparent text-center font-bold tabular-nums outline-none',
                big ? 'text-3xl' : 'text-2xl',
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(value === null ? '' : `${value}`);
                setEditing(true);
              }}
              className={cn(
                'num text-center font-bold leading-none tabular-nums',
                big ? 'text-3xl' : 'text-2xl',
                value === null
                  ? 'text-text-faint'
                  : emberWhenSet
                    ? 'text-gradient-ember'
                    : 'text-text',
              )}
            >
              {display}
              {suffix && value !== null && <span className="ml-0.5 text-xs text-text-faint">{suffix}</span>}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => bump(1)}
          aria-label={`Increase ${label ?? ''}`}
          className={cn(
            'tap grid place-items-center rounded-xl surface-2 border border-border text-text-dim active:text-text',
            big ? 'h-12 w-12' : 'h-11 w-11',
          )}
        >
          <Plus size={big ? 22 : 18} />
        </button>
      </div>
    </div>
  );
}
