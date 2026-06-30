'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { coachChatTurn, coachFinishChat } from '@/app/actions/coach';

// Mirrors lib/coach/intake.ts INTAKE_OPENER (server-only there).
const OPENER =
  "Let's get real for a second. What's the one thing you actually want out of your training right now — and be specific, not “get in shape.”";

type Msg = { role: 'assistant' | 'user'; content: string };

export function OnboardingChat({ onDone, onFallback }: { onDone: () => void; onFallback: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: OPENER }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [turns, setTurns] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setTurns((t) => t + 1);
    const res = await coachChatTurn(next);
    setBusy(false);
    if (!res.ok) {
      onFallback();
      return;
    }
    setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    if (res.done) setDone(true);
  }

  async function finish() {
    setSaving(true);
    const res = await coachFinishChat(messages);
    setSaving(false);
    if (!res.ok) {
      onFallback();
      return;
    }
    onDone();
  }

  return (
    <div className="flex h-[62dvh] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto pb-2">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              data-msg={m.role}
              className={cn(
                'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug',
                m.role === 'user'
                  ? 'rounded-br-md bg-ember-grad font-medium text-black'
                  : 'rounded-bl-md border border-border surface-2 text-text',
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border surface-2 px-3.5 py-3 text-text-dim">
              <span className="flex gap-1">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </span>
            </div>
          </div>
        )}
      </div>

      {done ? (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-mint">
            <Check size={14} /> Got what I need.
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={finish} disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Lock in my profile</>}
          </Button>
        </div>
      ) : (
        <div className="border-t border-border pt-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type your answer…"
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl surface-2 border border-border px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus-visible:border-ice focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="tap grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ember-grad text-black shadow-ember-sm disabled:opacity-40"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-0.5">
            <button onClick={onFallback} className="text-[11px] text-text-faint underline-offset-2 hover:underline">
              Use the quick form instead
            </button>
            {turns >= 3 && (
              <button onClick={finish} disabled={saving} className="text-[11px] font-medium text-ice">
                {saving ? 'Saving…' : "I'm done — save it"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-text-faint" style={{ animationDelay: delay }} />;
}
