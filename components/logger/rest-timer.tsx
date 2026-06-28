'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, SkipForward, Timer } from 'lucide-react';
import { formatClock } from '@/lib/format';

type RestState = {
  total: number;
  remaining: number;
  running: boolean;
  finishedAt: number | null;
  label: string | null;
};

type RestCtx = {
  state: RestState;
  start: (seconds: number, label?: string) => void;
  addTime: (delta: number) => void;
  skip: () => void;
};

const Ctx = createContext<RestCtx | null>(null);

export function useRestTimer() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRestTimer must be used within RestTimerProvider');
  return c;
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RestState>({
    total: 0,
    remaining: 0,
    running: false,
    finishedAt: null,
    label: null,
  });
  const endsAtRef = useRef<number | null>(null);

  // Tick from a wall-clock timestamp so scrolling / re-renders never drift.
  useEffect(() => {
    const id = setInterval(() => {
      if (endsAtRef.current == null) return;
      const remaining = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setState((s) => {
        if (!s.running) return s;
        if (remaining <= 0) {
          endsAtRef.current = null;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate?.([60, 40, 120]); } catch {}
          }
          return { ...s, remaining: 0, running: false, finishedAt: Date.now() };
        }
        return { ...s, remaining };
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Auto-hide the "done" state after a few seconds.
  useEffect(() => {
    if (state.finishedAt == null) return;
    const t = setTimeout(() => setState((s) => (s.finishedAt ? { ...s, finishedAt: null, total: 0 } : s)), 4000);
    return () => clearTimeout(t);
  }, [state.finishedAt]);

  const start = useCallback((seconds: number, label?: string) => {
    if (seconds <= 0) return;
    endsAtRef.current = Date.now() + seconds * 1000;
    setState({ total: seconds, remaining: seconds, running: true, finishedAt: null, label: label ?? null });
  }, []);

  const addTime = useCallback((delta: number) => {
    setState((s) => {
      if (!s.running || endsAtRef.current == null) return s;
      const newRemaining = Math.max(5, s.remaining + delta);
      endsAtRef.current = Date.now() + newRemaining * 1000;
      return { ...s, remaining: newRemaining, total: Math.max(s.total, newRemaining) };
    });
  }, []);

  const skip = useCallback(() => {
    endsAtRef.current = null;
    setState((s) => ({ ...s, running: false, remaining: 0, finishedAt: null, total: 0 }));
  }, []);

  return (
    <Ctx.Provider value={{ state, start, addTime, skip }}>
      {children}
      <RestTimerOverlay />
    </Ctx.Provider>
  );
}

function RestRing({ remaining, total }: { remaining: number; total: number }) {
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? remaining / total : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="rest-ember" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB23D" />
            <stop offset="55%" stopColor="#FF6A2C" />
            <stop offset="100%" stopColor="#FF2D55" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#rest-ember)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ ease: 'linear', duration: 0.25 }}
        />
      </svg>
      <span className="num absolute text-xl font-bold tabular-nums text-text">{formatClock(remaining)}</span>
    </div>
  );
}

function RestTimerOverlay() {
  const { state, addTime, skip } = useRestTimer();
  const visible = state.running || state.finishedAt != null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed inset-x-0 z-40 mx-auto flex max-w-xl justify-center px-4"
          style={{ bottom: 'calc(76px + var(--safe-bottom))' }}
        >
          {state.finishedAt != null ? (
            <div className="flex items-center gap-2 rounded-pill border border-mint/30 bg-mint/12 px-5 py-2.5 text-mint shadow-mint">
              <Timer size={16} />
              <span className="text-sm font-semibold">Rest complete — go</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[28px] border border-border bg-surface/95 px-3 py-2 shadow-soft backdrop-blur-xl animate-pulse-ember">
              <button
                onClick={() => addTime(-15)}
                className="tap grid h-10 w-10 place-items-center rounded-full surface-2 text-text-dim"
                aria-label="Subtract 15 seconds"
              >
                <Minus size={18} />
              </button>
              <RestRing remaining={state.remaining} total={state.total} />
              <button
                onClick={() => addTime(15)}
                className="tap grid h-10 w-10 place-items-center rounded-full surface-2 text-text-dim"
                aria-label="Add 15 seconds"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={skip}
                className="tap grid h-10 w-10 place-items-center rounded-full bg-ember-grad text-black"
                aria-label="Skip rest"
              >
                <SkipForward size={18} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
