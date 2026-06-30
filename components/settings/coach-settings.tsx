'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Loader2, Mic, Sparkles, MessageSquare, Phone, MoonStar, Target,
  ChevronRight, Check, AlertTriangle, Send, Pencil,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Chip } from '@/components/ui/chip';
import { BottomSheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PERSONAS, PERSONA_BY_ID, GOAL_OPTIONS, goalLabel } from '@/lib/coach/personas';
import type { PersonaMeta } from '@/lib/coach/personas';
import { saveOnboarding, saveCoachConfig, savePhone, testCoach } from '@/app/actions/coach';
import { OnboardingChat } from '@/components/settings/coach-onboarding-chat';

export type CoachProfileDTO = {
  onboarded: boolean;
  primaryGoal: string | null;
  goalDetail: string | null;
  why: string | null;
  whyDeeper: string | null;
  identity: string | null;
  obstacles: string | null;
  trainingDaysPerWeek: number;
  enabled: boolean;
  persona: string;
  intensity: number;
  channel: string;
  phoneNumber: string | null;
  smsConsent: boolean;
  smsStopped: boolean;
  timezone: string;
  quietStartHour: number;
  quietEndHour: number;
};

export type CoachEnv = { ai: boolean; sms: boolean };

const ACCENT_RING: Record<string, string> = {
  ember: 'border-ember-2/60 bg-ember-grad-soft',
  mint: 'border-mint/50 bg-mint/5',
  ice: 'border-ice/50 bg-ice/5',
};
const ACCENT_TEXT: Record<string, string> = { ember: 'text-ember-1', mint: 'text-mint', ice: 'text-ice' };

function hourLabel(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'UTC',
];

export function CoachSettings({ profile, env }: { profile: CoachProfileDTO; env: CoachEnv }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(profile.enabled);
  const [persona, setPersona] = useState(profile.persona);
  const [intensity, setIntensity] = useState(profile.intensity);
  const [channel, setChannel] = useState(profile.channel);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardMode, setOnboardMode] = useState<'chat' | 'form'>('form');
  // The explicit tier awaiting one-time consent before it's selected.
  const [gateTier, setGateTier] = useState<PersonaMeta | null>(null);
  // Explicit tiers the user has already unlocked this session (so re-selecting
  // them doesn't re-prompt). The currently-saved persona counts as unlocked.
  const [unlocked, setUnlocked] = useState<Set<string>>(
    () => new Set(PERSONA_BY_ID[profile.persona as keyof typeof PERSONA_BY_ID] ? [profile.persona] : []),
  );

  function selectPersona(p: PersonaMeta) {
    setPersona(p.id);
    pushConfig({ persona: p.id });
  }

  function onTierTap(p: PersonaMeta) {
    if (p.explicit && !unlocked.has(p.id)) {
      setGateTier(p); // open the consent gate; only save on confirm
      return;
    }
    selectPersona(p);
  }

  function confirmGate() {
    if (!gateTier) return;
    setUnlocked((prev) => new Set(prev).add(gateTier.id));
    selectPersona(gateTier);
    setGateTier(null);
  }

  function openOnboarding() {
    // Fresh setup with AI available → conversational intake; editing or no AI → quick form.
    setOnboardMode(!profile.onboarded && env.ai ? 'chat' : 'form');
    setOnboardOpen(true);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }
  function pushConfig(data: Parameters<typeof saveCoachConfig>[0]) {
    startTransition(async () => {
      await saveCoachConfig(data);
      router.refresh();
    });
  }

  return (
    <section className="rounded-card border border-ember-2/25 bg-surface p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-ember-grad text-black shadow-ember-sm">
          <Flame size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold leading-tight">Accountability Coach</h2>
          <p className="text-[11px] text-text-faint">An AI that texts you when you’re slipping.</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => {
            setEnabled(v);
            pushConfig({ enabled: v });
          }}
        />
      </div>

      {/* Capability hints */}
      <div className="mb-3 flex flex-wrap gap-1.5 text-[10px]">
        <CapChip ok={env.ai} on="Grok voice on" off="Templated voice" />
        <CapChip ok={env.sms} on="SMS ready" off="In-app only" />
      </div>

      {/* Onboarding summary / CTA */}
      {profile.onboarded ? (
        <button
          onClick={openOnboarding}
          className="tap mb-3 flex w-full items-start gap-3 rounded-xl border border-border surface-2 p-3 text-left"
        >
          <Target size={16} className="mt-0.5 shrink-0 text-ember-1" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {goalLabel(profile.primaryGoal) || 'Your goal'}
              {profile.goalDetail ? <span className="text-text-dim"> · {profile.goalDetail}</span> : null}
            </div>
            {profile.why && <div className="mt-0.5 line-clamp-2 text-[12px] italic text-text-dim">“{profile.why}”</div>}
          </div>
          <Pencil size={14} className="mt-0.5 shrink-0 text-text-faint" />
        </button>
      ) : (
        <button
          onClick={openOnboarding}
          className="tap mb-3 flex w-full items-center gap-3 rounded-xl border border-ember-2/30 bg-ember-grad-soft p-3.5 text-left"
        >
          <Sparkles size={18} className="shrink-0 text-ember-1" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Set up your coach</div>
            <div className="text-[11px] text-text-dim">Tell it your goal and your why — that’s the fuel.</div>
          </div>
          <ChevronRight size={16} className="shrink-0 text-text-faint" />
        </button>
      )}

      {/* Coach spectrum picker — gentle (top) → unhinged (bottom) */}
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-faint">
        <MessageSquare size={12} /> Choose your coach
      </div>
      <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide">
        <span className="text-mint">Gentle</span>
        <span className="h-px flex-1 mx-2 bg-gradient-to-r from-mint/40 via-ember-2/40 to-ember-3/60" />
        <span className="text-ember-3">Unhinged</span>
      </div>
      <div className="space-y-2">
        {PERSONAS.map((p) => {
          const active = persona === p.id;
          const locked = p.explicit && !unlocked.has(p.id);
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onTierTap(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTierTap(p);
                }
              }}
              className={cn(
                'tap w-full cursor-pointer rounded-xl border p-3 text-left transition-colors',
                active ? ACCENT_RING[p.accent] : 'border-border surface-2',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{p.emoji}</span>
                <span className="font-display text-sm font-semibold">{p.name}</span>
                <span className={cn('text-[11px]', active ? ACCENT_TEXT[p.accent] : 'text-text-faint')}>{p.tagline}</span>
                {active ? (
                  <Check size={15} className={cn('ml-auto', ACCENT_TEXT[p.accent])} />
                ) : p.explicit ? (
                  <span
                    className={cn(
                      'ml-auto inline-flex items-center gap-1 rounded-pill border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                      locked ? 'border-ember-3/40 bg-ember-3/10 text-ember-3' : 'border-mint/40 bg-mint/10 text-mint',
                    )}
                  >
                    {locked ? <><Flame size={10} /> Gated</> : <><Check size={10} /> Unlocked</>}
                  </span>
                ) : null}
              </div>
              {/* heat bars — fill by spectrum position */}
              <div className="mt-2 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      i <= p.tier ? (p.explicit ? 'bg-ember-grad' : 'bg-ember-2/70') : 'bg-border',
                    )}
                  />
                ))}
              </div>
              {active && (
                <>
                  <p className="mt-2 text-[12px] text-text-dim">{p.blurb}</p>
                  <div className="mt-2 rounded-lg border border-border bg-bg/40 p-2.5">
                    <div className="mb-1 text-[9px] uppercase tracking-wide text-text-faint">Sample text</div>
                    <p className="text-[12.5px] leading-snug text-text">{p.samples[0]}</p>
                  </div>
                  {p.explicit && (
                    <div className="mt-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-ember-2">
                        <AlertTriangle size={11} /> Opt-in tough love. Dial the heat:
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((lv) => (
                          <button
                            key={lv}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIntensity(lv);
                              pushConfig({ intensity: lv });
                            }}
                            className={cn(
                              'tap flex-1 rounded-lg border py-1.5 text-[11px] font-semibold',
                              intensity === lv ? 'border-ember-2/60 bg-ember-2/15 text-ember-1' : 'border-border surface-2 text-text-dim',
                            )}
                          >
                            {lv === 1 ? 'Spicy' : lv === 2 ? 'Brutal' : 'Unhinged'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Flame-gate: one-time consent before an explicit tier is selected */}
      <ConsentGate tier={gateTier} onConfirm={confirmGate} onCancel={() => setGateTier(null)} />

      {/* Delivery channel */}
      <div className="mb-1.5 mt-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-faint">
        <Send size={12} /> How it reaches you
      </div>
      <div className="flex gap-1.5">
        {([
          { id: 'in_app', label: 'In-app' },
          { id: 'sms', label: 'Texts' },
          { id: 'both', label: 'Both' },
        ] as const).map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setChannel(c.id);
              pushConfig({ channel: c.id });
            }}
            className={cn(
              'tap flex-1 rounded-lg border py-2 text-[12px] font-semibold',
              channel === c.id ? 'border-ice/50 bg-ice/10 text-ice' : 'border-border surface-2 text-text-dim',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {(channel === 'sms' || channel === 'both') && (
        <PhoneBlock profile={profile} env={env} onSaved={refresh} />
      )}

      {/* Quiet hours + timezone */}
      <QuietHours profile={profile} onPush={pushConfig} />

      {/* Test */}
      <TestCoach disabled={!profile.onboarded} />

      <BottomSheet
        open={onboardOpen}
        onOpenChange={setOnboardOpen}
        title={onboardMode === 'chat' ? 'Talk to your coach' : 'Your coach’s fuel'}
        description={onboardMode === 'chat' ? 'A few real questions. No wrong answers.' : 'Honest answers make the nudges hit harder.'}
      >
        {onboardMode === 'chat' ? (
          <OnboardingChat
            onDone={() => { setOnboardOpen(false); refresh(); }}
            onFallback={() => setOnboardMode('form')}
          />
        ) : (
          <OnboardingForm profile={profile} onDone={() => { setOnboardOpen(false); refresh(); }} />
        )}
      </BottomSheet>
    </section>
  );
}

// ---------- Flame-gate consent (explicit tiers) ----------
function ConsentGate({
  tier,
  onConfirm,
  onCancel,
}: {
  tier: PersonaMeta | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <BottomSheet
      open={!!tier}
      onOpenChange={(o) => { if (!o) onCancel(); }}
      title={tier ? `Unlock ${tier.name}?` : ''}
      description={
        tier?.id === 'unhinged'
          ? 'The dial pinned to NO MERCY — funny, loud, and not for everyone.'
          : 'It swears at your excuses and quotes your why back when you fold.'
      }
    >
      {tier && (
        <div className="space-y-4 pb-2">
          <div className="grid place-items-center pt-1 text-5xl" aria-hidden>
            {tier.emoji}
          </div>
          <p className="text-center text-[13px] leading-relaxed text-text-dim">
            {tier.id === 'unhinged'
              ? 'It yells through the screen, “slaps” you, and won’t let you hide behind a single word. Funny, mean, effective — and not for everyone.'
              : 'It swears at your excuses and quotes your why back when you fold. Funny, mean, effective — and not for everyone.'}
          </p>
          <div className="flex items-start gap-2 rounded-xl border border-ember-2/25 bg-ember-grad-soft p-3 text-[11px] leading-snug text-text-dim">
            <Flame size={14} className="mt-0.5 shrink-0 text-ember-1" />
            <span>
              The floor never moves: contempt for the excuse, never you. No slurs, nothing sexual, no real violence,
              nothing about self-harm. On any injury it breaks character and tells you to rest. Dial it down or kill it in
              one tap.
            </span>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={onConfirm}>
            <Flame size={16} /> I’m in — unlock {tier.name}
          </Button>
          <button onClick={onCancel} className="tap w-full py-2 text-center text-[13px] font-medium text-text-dim">
            Not yet — keep me where I am
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function CapChip({ ok, on, off }: { ok: boolean; on: string; off: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-medium',
        ok ? 'border-mint/40 bg-mint/10 text-mint' : 'border-border surface-2 text-text-faint',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-mint' : 'bg-text-faint')} />
      {ok ? on : off}
    </span>
  );
}

// ---------- Phone + consent ----------
function PhoneBlock({ profile, env, onSaved }: { profile: CoachProfileDTO; env: CoachEnv; onSaved: () => void }) {
  const [phone, setPhone] = useState(profile.phoneNumber ?? '');
  const [consent, setConsent] = useState(profile.smsConsent);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(nextConsent = consent) {
    setSaving(true);
    setErr(null);
    const res = await savePhone({ phoneNumber: phone, smsConsent: nextConsent });
    setSaving(false);
    if (!res.ok) setErr(res.error ?? 'Could not save.');
    else onSaved();
  }

  return (
    <div className="mt-2.5 space-y-2.5 rounded-xl border border-border surface-2 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-dim">
        <Phone size={12} /> Your number
      </div>
      <div className="flex gap-2">
        <Input
          inputMode="tel"
          placeholder="+1 415 555 1234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => phone !== (profile.phoneNumber ?? '') && save()}
        />
        <Button size="md" variant="surface" onClick={() => save()} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
        </Button>
      </div>
      {err && <p className="text-[11px] text-ember-3">{err}</p>}

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            save(e.target.checked);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--mint)]"
        />
        <span className="text-[11px] leading-snug text-text-dim">
          I agree to receive recurring automated accountability texts from FORGE at this number. Msg &amp; data rates may
          apply. Reply STOP to opt out, HELP for help.
        </span>
      </label>
      {profile.smsStopped && (
        <p className="text-[11px] text-ember-2">You replied STOP — texts are paused. Re-check consent to resume.</p>
      )}
      {!env.sms && (
        <p className="text-[11px] text-text-faint">
          Texting isn’t wired up yet — add Twilio keys on the server and these nudges go to your phone. Until then they
          appear in-app.
        </p>
      )}
    </div>
  );
}

// ---------- Quiet hours ----------
function QuietHours({ profile, onPush }: { profile: CoachProfileDTO; onPush: (d: Parameters<typeof saveCoachConfig>[0]) => void }) {
  const [start, setStart] = useState(profile.quietStartHour);
  const [end, setEnd] = useState(profile.quietEndHour);
  const [tz, setTz] = useState(profile.timezone);
  // Resolve the device timezone only after mount — doing it during render would
  // differ from the server and trip a hydration mismatch.
  const [deviceTz, setDeviceTz] = useState('');
  useEffect(() => {
    try {
      setDeviceTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="mt-2.5 space-y-2.5 rounded-xl border border-border surface-2 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-dim">
        <MoonStar size={12} /> Quiet hours — no texts
      </div>
      <div className="flex items-center gap-2 text-sm">
        <HourSelect value={start} onChange={(h) => { setStart(h); onPush({ quietStartHour: h }); }} />
        <span className="text-text-faint">to</span>
        <HourSelect value={end} onChange={(h) => { setEnd(h); onPush({ quietEndHour: h }); }} />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={tz}
          onChange={(e) => { setTz(e.target.value); onPush({ timezone: e.target.value }); }}
          className="h-9 flex-1 rounded-lg surface-2 border border-border px-2 text-[12px] text-text"
        >
          {[...new Set([tz, deviceTz, ...TIMEZONES].filter(Boolean))].map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        {deviceTz && deviceTz !== tz && (
          <Button size="sm" variant="surface" onClick={() => { setTz(deviceTz); onPush({ timezone: deviceTz }); }}>
            Use device
          </Button>
        )}
      </div>
    </div>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-lg surface-2 border border-border px-2 text-[12px] text-text"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{hourLabel(h)}</option>
      ))}
    </select>
  );
}

// ---------- Test your coach ----------
function TestCoach({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ body?: string; channel?: string; source?: string; smsError?: string; sent?: boolean } | null>(null);

  return (
    <div className="mt-3">
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={disabled || pending}
        onClick={() => start(async () => setResult(await testCoach()))}
      >
        {pending ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Test your coach</>}
      </Button>
      {disabled && <p className="mt-1.5 text-center text-[11px] text-text-faint">Set up your coach first.</p>}
      {result?.body && (
        <div className="mt-3 rounded-2xl rounded-bl-md border border-ember-2/30 bg-ember-grad-soft p-3.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ember-1">
            <Flame size={11} />
            {result.channel === 'sms' ? 'Texted to your phone' : 'In-app preview'}
            <span className="text-text-faint">· {result.source === 'ai' ? 'AI' : 'template'}</span>
          </div>
          <p className="text-sm leading-relaxed text-text">{result.body}</p>
          {result.smsError && (
            <p className="mt-1.5 text-[11px] text-ember-2">Couldn’t text ({result.smsError}); shown in-app instead.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Onboarding questionnaire ----------
function OnboardingForm({ profile, onDone }: { profile: CoachProfileDTO; onDone: () => void }) {
  const [goal, setGoal] = useState(profile.primaryGoal ?? '');
  const [goalDetail, setGoalDetail] = useState(profile.goalDetail ?? '');
  const [why, setWhy] = useState(profile.why ?? '');
  const [whyDeeper, setWhyDeeper] = useState(profile.whyDeeper ?? '');
  const [identity, setIdentity] = useState(profile.identity ?? '');
  const [obstacles, setObstacles] = useState(profile.obstacles ?? '');
  const [days, setDays] = useState(profile.trainingDaysPerWeek);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await saveOnboarding({
      primaryGoal: goal || undefined,
      goalDetail,
      why,
      whyDeeper,
      identity,
      obstacles,
      trainingDaysPerWeek: days,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-4 pb-2">
      <Field label="What’s your main goal?">
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <Chip key={g.id} active={goal === g.id} tone="ember" onClick={() => setGoal(g.id)}>
              {g.emoji} {g.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Get specific" hint="Put a number on it.">
        <Input placeholder="e.g. lose 20 lb, bench 225, deadlift 4 plates" value={goalDetail} onChange={(e) => setGoalDetail(e.target.value)} />
      </Field>

      <Field label="Why do you want this?" hint="The real reason. This is what your coach throws back at you.">
        <DictatableTextarea value={why} onChange={setWhy} placeholder="Be honest. Why does this actually matter to you?" />
      </Field>

      <Field label="And why does that matter?" hint="Optional — go one layer deeper.">
        <Textarea value={whyDeeper} onChange={(e) => setWhyDeeper(e.target.value)} placeholder="Keep asking why until it stings a little." />
      </Field>

      <Field label="Who are you becoming?" hint="Optional — the identity you’re training into.">
        <Input placeholder="e.g. someone who doesn’t quit on themselves" value={identity} onChange={(e) => setIdentity(e.target.value)} />
      </Field>

      <Field label="What’s derailed you before?" hint="Optional — so your coach can call it out.">
        <Textarea value={obstacles} onChange={(e) => setObstacles(e.target.value)} placeholder="Late nights, low energy, travel, motivation dips…" />
      </Field>

      <Field label="Training days per week">
        <div className="flex items-center gap-3">
          <button onClick={() => setDays((d) => Math.max(1, d - 1))} className="tap grid h-10 w-10 place-items-center rounded-xl surface-2 border border-border text-lg text-text-dim">−</button>
          <span className="num w-10 text-center text-2xl font-bold">{days}</span>
          <button onClick={() => setDays((d) => Math.min(7, d + 1))} className="tap grid h-10 w-10 place-items-center rounded-xl surface-2 border border-border text-lg text-text-dim">+</button>
          <span className="text-sm text-text-faint">days / week</span>
        </div>
      </Field>

      <Button variant="primary" size="lg" className="w-full" onClick={submit} disabled={saving}>
        {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save & arm my coach'}
      </Button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-text-faint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

/** Textarea with optional browser dictation (Web Speech API) — free, no setup. */
function DictatableTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  // Gate behind mount so SSR and first client render agree (no mic button until mounted).
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  function toggle() {
    if (!supported) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = true;
    const base = value;
    rec.onresult = (e: any) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      onChange((base ? base + ' ' : '') + text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div className="relative">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-11" />
      {supported && (
        <button
          type="button"
          onClick={toggle}
          aria-label={listening ? 'Stop dictation' : 'Dictate'}
          className={cn(
            'tap absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border',
            listening ? 'animate-pulse-ember border-ember-2/60 bg-ember-2/20 text-ember-1' : 'border-border surface-2 text-text-dim',
          )}
        >
          <Mic size={15} />
        </button>
      )}
    </div>
  );
}
