'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Dumbbell, ShieldCheck, Ruler, Timer } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { equipmentLabel, formatClock } from '@/lib/format';
import { EQUIPMENT } from '@/lib/constants';
import { kgToDisplay, displayToKg, roundDisplay, type Units } from '@/lib/units';
import { updateSettings } from '@/app/actions/settings';
import type { AppSettings } from '@/lib/settings';
import type { Equipment } from '@prisma/client';

export function SettingsView({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [units, setUnits] = useState<Units>(settings.units);
  const [backSafe, setBackSafe] = useState(settings.backSafeOnly);
  const [myEquip, setMyEquip] = useState(settings.myEquipmentOnly);
  const [equipment, setEquipment] = useState<Equipment[]>(settings.availableEquipment);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [loggingOut, setLoggingOut] = useState(false);

  function push(data: Parameters<typeof updateSettings>[0]) {
    startTransition(async () => {
      await updateSettings(data);
      router.refresh();
    });
  }

  function changeUnits(u: Units) {
    setUnits(u);
    push({ units: u });
  }
  function toggleEquip(e: Equipment) {
    const next = equipment.includes(e) ? equipment.filter((x) => x !== e) : [...equipment, e];
    setEquipment(next);
    push({ availableEquipment: next });
  }
  function changeRest(delta: number) {
    const next = Math.max(0, Math.min(600, rest + delta));
    setRest(next);
    push({ defaultRestSec: next });
  }

  async function logout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="space-y-4 px-4 pb-8 pt-3">
      {/* Units */}
      <Section icon={<Ruler size={16} className="text-ice" />} title="Units" subtitle="Stored in kg, shown in your unit">
        <div className="flex gap-2">
          {(['kg', 'lb'] as const).map((u) => (
            <Chip key={u} active={units === u} tone="ember" onClick={() => changeUnits(u)}>
              {u.toUpperCase()}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Swap defaults */}
      <Section icon={<ShieldCheck size={16} className="text-mint" />} title="Swap defaults" subtitle="Applied when you open the swap drawer">
        <div className="space-y-2">
          <ToggleRow label="Back-safe only" desc="Hide spinal-loading lifts by default" checked={backSafe} onChange={(v) => { setBackSafe(v); push({ backSafeOnly: v }); }} />
          <ToggleRow label="My equipment only" desc="Only show exercises you can build" checked={myEquip} onChange={(v) => { setMyEquip(v); push({ myEquipmentOnly: v }); }} />
        </div>
      </Section>

      {/* Equipment */}
      <Section icon={<Dumbbell size={16} className="text-ember-1" />} title="Available equipment" subtitle={`${equipment.length} of ${EQUIPMENT.length} selected`}>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => (
            <Chip key={e} active={equipment.includes(e)} onClick={() => toggleEquip(e)}>
              {equipmentLabel(e)}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Default rest */}
      <Section icon={<Timer size={16} className="text-ember-2" />} title="Default rest" subtitle="Used when a slot has no prescribed rest">
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => changeRest(-15)} className="tap grid h-11 w-11 place-items-center rounded-xl surface-2 border border-border text-text-dim">−</button>
          <span className="num grid h-12 min-w-[80px] place-items-center text-2xl font-bold tabular-nums">{formatClock(rest)}</span>
          <button onClick={() => changeRest(15)} className="tap grid h-11 w-11 place-items-center rounded-xl surface-2 border border-border text-text-dim">+</button>
        </div>
      </Section>

      {/* Increments */}
      <Section icon={<Dumbbell size={16} className="text-ember-1" />} title="Load increments" subtitle="Used by progression hints">
        <div className="grid grid-cols-2 gap-2 text-center">
          <IncrementTile label="Upper body" kg={settings.incrementUpperKg} units={units} onChange={(kg) => push({ incrementUpperKg: kg })} />
          <IncrementTile label="Lower body" kg={settings.incrementLowerKg} units={units} onChange={(kg) => push({ incrementLowerKg: kg })} />
        </div>
      </Section>

      {/* Session */}
      <Section icon={<LogOut size={16} className="text-text-dim" />} title="Session" subtitle="Single-passcode access">
        <Button variant="danger" size="lg" className="w-full" onClick={logout} disabled={loggingOut}>
          {loggingOut ? <Loader2 className="animate-spin" size={18} /> : <><LogOut size={16} /> Log out</>}
        </Button>
      </Section>

      <p className="px-1 pt-2 text-center text-[11px] text-text-faint">FORGE · a precision instrument for serious lifting</p>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <h2 className="font-display text-base font-semibold leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-text-faint">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border surface-2 px-3.5 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-text-faint">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function IncrementTile({ label, kg, units, onChange }: { label: string; kg: number; units: Units; onChange: (kg: number) => void }) {
  const step = units === 'lb' ? 1 : 0.5;
  const display = roundDisplay(kgToDisplay(kg, units)!, units);
  return (
    <div className="rounded-xl border border-border surface-2 px-2 py-3">
      <div className="text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <button onClick={() => onChange(displayToKg(Math.max(step, display - step), units))} className="tap grid h-8 w-8 place-items-center rounded-lg surface-2 border border-border text-text-dim">−</button>
        <span className="num min-w-[44px] text-lg font-bold">{display}</span>
        <button onClick={() => onChange(displayToKg(display + step, units))} className="tap grid h-8 w-8 place-items-center rounded-lg surface-2 border border-border text-text-dim">+</button>
      </div>
      <div className="mt-0.5 text-[10px] text-text-faint">{units}</div>
    </div>
  );
}
