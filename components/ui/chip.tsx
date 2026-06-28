'use client';

import { cn } from '@/lib/utils';

export function Chip({
  active,
  children,
  onClick,
  className,
  tone = 'default',
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: 'default' | 'mint' | 'ember';
}) {
  const activeCls =
    tone === 'mint'
      ? 'bg-mint/15 border-mint/40 text-mint'
      : tone === 'ember'
        ? 'bg-ember-2/15 border-ember-2/40 text-ember-1'
        : 'bg-text/10 border-text/30 text-text';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'tap shrink-0 whitespace-nowrap rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors',
        active ? activeCls : 'border-border surface-2 text-text-dim hover:text-text',
        className,
      )}
    >
      {children}
    </button>
  );
}
