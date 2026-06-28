'use client';

import { MotionConfig } from 'framer-motion';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // reducedMotion="user" makes every Framer animation respect the OS setting.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
