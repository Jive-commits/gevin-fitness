'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'forge.lifterMode';

type LifterModeContextValue = {
  /** True = full power-user nav (6 tabs). Default false = focused 2-tab consumer IA. */
  lifterMode: boolean;
  setLifterMode: (value: boolean) => void;
  /** False until the localStorage read has run on the client (SSR-safe). */
  hydrated: boolean;
};

const LifterModeContext = createContext<LifterModeContextValue | null>(null);

export function LifterModeProvider({ children }: { children: React.ReactNode }) {
  // Default false on both SSR and the first client paint to avoid a hydration
  // mismatch — the real preference is read from localStorage after mount.
  const [lifterMode, setLifterModeState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setLifterModeState(window.localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // localStorage unavailable (private mode / SSR) — keep the default.
    }
    setHydrated(true);
  }, []);

  function setLifterMode(value: boolean) {
    setLifterModeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      // Best-effort persistence only.
    }
  }

  return (
    <LifterModeContext.Provider value={{ lifterMode, setLifterMode, hydrated }}>
      {children}
    </LifterModeContext.Provider>
  );
}

export function useLifterMode(): LifterModeContextValue {
  const ctx = useContext(LifterModeContext);
  if (!ctx) throw new Error('useLifterMode must be used within a LifterModeProvider');
  return ctx;
}
