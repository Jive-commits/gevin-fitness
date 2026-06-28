'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, CalendarDays, Library, LineChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/today', label: 'Today', icon: Flame },
  { href: '/program', label: 'Program', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
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
