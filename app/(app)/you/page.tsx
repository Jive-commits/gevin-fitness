import Link from 'next/link';
import {
  LineChart,
  CalendarDays,
  Library,
  ListChecks,
  Settings,
  ChevronRight,
  Flame,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { LifterModeRow } from '@/components/you/lifter-mode-row';
import { getSettings } from '@/lib/settings';
import { getTotals, getConsistency } from '@/lib/analytics';
import { kgToDisplay } from '@/lib/units';

export const dynamic = 'force-dynamic';

const NAV_ROWS = [
  { href: '/progress', label: 'Progress', desc: 'Your strength trend and PRs', icon: LineChart, tint: 'text-mint' },
  { href: '/history', label: 'History', desc: 'Every session you’ve logged', icon: ListChecks, tint: 'text-ice' },
  { href: '/library', label: 'Exercises', desc: 'Browse and swap movements', icon: Library, tint: 'text-ember-1' },
  { href: '/program', label: 'Program', desc: 'Your full training week', icon: CalendarDays, tint: 'text-ember-2' },
  { href: '/settings', label: 'Settings', desc: 'Units, equipment, coach, account', icon: Settings, tint: 'text-text-dim' },
] as const;

export default async function YouPage() {
  const settings = await getSettings();
  const [totals, consistency] = await Promise.all([getTotals(), getConsistency()]);
  const units = settings.units;
  const tonnageDisplay = Math.round(kgToDisplay(totals.tonnageKg, units) ?? 0);

  return (
    <>
      <PageHeader title="You" eyebrow="Your forge" />

      <div className="space-y-6 px-4 pb-8 pt-4">
        {/* High-signal personal stats — kept deliberately light. */}
        <section className="grid grid-cols-3 gap-2">
          <Stat icon={<Flame size={15} className="text-ember-1" />} label="Streak" value={`${consistency.streakWeeks}`} unit="wk" />
          <Stat icon={<CalendarCheck size={15} className="text-mint" />} label="Sessions" value={`${totals.sessions}`} />
          <Stat icon={<Layers size={15} className="text-ice" />} label="Volume" value={tonnageDisplay.toLocaleString()} unit={units} />
        </section>

        {/* Navigation rows into the reference surfaces. */}
        <section className="space-y-2">
          {NAV_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <Link
                key={row.href}
                href={row.href}
                className="tap flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl surface-2 border border-border">
                  <Icon size={17} className={row.tint} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{row.label}</div>
                  <div className="truncate text-[11px] text-text-faint">{row.desc}</div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-text-faint" />
              </Link>
            );
          })}
        </section>

        {/* Power-user toggle — the one switch back to the full instrument. */}
        <section>
          <h2 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-text-faint">
            Mode
          </h2>
          <LifterModeRow />
        </section>
      </div>
    </>
  );
}

function Stat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-card border border-border surface-2 p-3">
      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-text-faint">
        {icon} {label}
      </div>
      <div className="num text-xl font-bold leading-none">
        {value}
        {unit && <span className="ml-0.5 text-xs text-text-faint">{unit}</span>}
      </div>
    </div>
  );
}
