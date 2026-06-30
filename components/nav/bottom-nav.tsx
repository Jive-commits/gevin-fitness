'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { House, Flame, CalendarDays, Library, LineChart, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLifterMode } from '@/components/providers/lifter-mode';

type Tab = {
  href: string;
  label: string;
  icon: typeof House;
  /** Extra route prefixes that should also light this tab up as active. */
  match?: string[];
};

// Focused consumer IA: two peer worlds. Today owns the workout loop; You owns
// identity, progress, history, and every reference drilldown.
const CONSUMER_TABS: Tab[] = [
  { href: '/home', label: 'Today', icon: Flame, match: ['/today'] },
  {
    href: '/you',
    label: 'You',
    icon: User,
    match: ['/progress', '/history', '/library', '/program', '/settings'],
  },
];

// The original power-user instrument — every tab, restored behind Lifter Mode.
const LIFTER_TABS: Tab[] = [
  { href: '/home', label: 'Home', icon: House },
  { href: '/today', label: 'Today', icon: Flame },
  { href: '/program', label: 'Program', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, tab: Tab): boolean {
  const prefixes = [tab.href, ...(tab.match ?? [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function BottomNav() {
  const pathname = usePathname();
  const { lifterMode, hydrated } = useLifterMode();

  // Render the consumer 2-tab layout for SSR and the first client paint; only
  // switch to the six-tab instrument after localStorage has hydrated.
  const tabs = hydrated && lifterMode ? LIFTER_TABS : CONSUMER_TABS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div
        className="mx-auto grid max-w-xl"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="tap relative flex flex-col items-center justify-center gap-1 py-2.5"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute top-0 h-[2px] w-8 rounded-full bg-ember-grad"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  active ? 'text-ember-2' : 'text-text-faint',
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-text' : 'text-text-faint',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
