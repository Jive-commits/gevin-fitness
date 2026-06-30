'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Flame, Sparkles, ChevronRight, Loader2, MessageSquare } from 'lucide-react';
import { personaMeta } from '@/lib/coach/personas';
import { coachPepTalk } from '@/app/actions/coach';
import { cn } from '@/lib/utils';

export type CoachCardData = {
  onboarded: boolean;
  enabled: boolean;
  persona: string;
  liveHeadline: string;
  liveTone: 'good' | 'warn' | 'idle';
  latestNudge: { id: string; body: string; trigger: string; channel: string; createdAt: number } | null;
};

const TONE: Record<string, string> = {
  good: 'text-mint',
  warn: 'text-ember-1',
  idle: 'text-text-dim',
};

export function CoachCard({ data }: { data: CoachCardData }) {
  const meta = personaMeta(data.persona);
  const [pending, start] = useTransition();
  const [fresh, setFresh] = useState<string | null>(null);

  if (!data.onboarded) {
    return (
      <Link
        href="/settings"
        className="tap mb-4 flex items-center gap-3 overflow-hidden rounded-card border border-ember-2/30 bg-ember-grad-soft p-4"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember-grad text-black shadow-ember-sm">
          <Flame size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold">Meet your AI accountability coach</div>
          <div className="text-[12px] text-text-dim">It texts you when you’re slipping. Pick a vibe — gentle to savage.</div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-text-faint" />
      </Link>
    );
  }

  const bubble = fresh ?? data.latestNudge?.body ?? null;

  return (
    <section className="mb-4 rounded-card border border-border bg-surface p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl surface-2 border border-border text-lg">
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-semibold">{meta.name}</span>
            {!data.enabled && <span className="rounded-pill surface-2 border border-border px-1.5 py-0.5 text-[9px] text-text-faint">paused</span>}
          </div>
          <div className={cn('text-[12px] font-medium', TONE[data.liveTone])}>{data.liveHeadline}</div>
        </div>
        <Link href="/settings" className="tap text-[11px] font-medium text-ice">Manage</Link>
      </div>

      {bubble && (
        <div className="mb-2.5 rounded-2xl rounded-bl-md border border-border surface-2 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-text-faint">
            <MessageSquare size={10} /> {fresh ? 'Just now' : data.latestNudge?.channel === 'sms' ? 'Texted you' : 'From your coach'}
          </div>
          <p className="text-[13px] leading-snug text-text">{bubble}</p>
        </div>
      )}

      <button
        onClick={() => start(async () => setFresh((await coachPepTalk()).body))}
        disabled={pending}
        className="tap flex w-full items-center justify-center gap-1.5 rounded-xl border border-ember-2/30 bg-ember-grad-soft py-2.5 text-[12px] font-semibold text-ember-1 disabled:opacity-60"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {bubble ? 'Another' : 'Get a pep talk'}
      </button>
    </section>
  );
}
