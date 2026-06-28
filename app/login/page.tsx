'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/today';
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (data.ok) {
        router.replace(next);
        router.refresh();
      } else {
        setError(data.error || 'Incorrect passcode.');
        setLoading(false);
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6">
      {/* Ambient ember glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(255,106,44,0.22), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="block h-2 w-2 animate-pulse-ember rounded-full bg-ember-2" />
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-text-faint">
              Precision Strength
            </span>
          </div>
          <h1 className="text-gradient-ember font-display text-6xl font-bold tracking-tight">
            FORGE
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium text-text-dim" htmlFor="passcode">
            Enter passcode
          </label>
          <div className="flex gap-2">
            <Input
              id="passcode"
              ref={inputRef}
              type="password"
              inputMode="text"
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••"
              className="num h-14 flex-1 text-center text-xl tracking-[0.3em]"
            />
            <button
              type="submit"
              disabled={loading || !passcode}
              className="tap grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ember-grad text-black shadow-ember-sm disabled:opacity-40"
              aria-label="Unlock"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <ArrowRight size={22} />}
            </button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-ember-3"
            >
              {error}
            </motion.p>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-text-faint">
          A single-lifter instrument. One passcode, one athlete.
        </p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
