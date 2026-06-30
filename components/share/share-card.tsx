'use client';

import { forwardRef } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The screenshot artifact. A bold, portrait (~9:16) card built to be screenshotted
 * and posted — big type, intense ember, minimal chrome, a small "forge" footer.
 * Renders one of two payloads.
 */
export type ShareCardData =
  | {
      kind: 'roast';
      /** The coach's latest message, shown as a big pull-quote. */
      quote: string;
      /** Tier / persona name (e.g. "The Savage"). */
      coachName: string;
      coachEmoji?: string;
    }
  | {
      kind: 'recap';
      /** The big headline number, e.g. "+15 lb". */
      headline: string;
      /** What moved, e.g. "on Squat". */
      subject: string;
      /** Supporting line, e.g. "this week · 135 → 150 lb". */
      detail?: string;
    };

export const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData; className?: string }>(
  function ShareCard({ data, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          // Portrait 9:16 artifact. Heavy ember wash over near-black so it reads
          // as a Forge object even cropped out of the app.
          'relative mx-auto flex aspect-[9/16] w-full max-w-[360px] flex-col overflow-hidden rounded-card border border-ember-2/30 bg-bg p-6 shadow-ember',
          className,
        )}
      >
        {/* Ember glow field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(120% 55% at 50% -8%, rgba(255,45,85,0.28), transparent 60%), radial-gradient(90% 45% at 100% 105%, rgba(255,106,44,0.22), transparent 55%)',
          }}
        />

        {/* Wordmark */}
        <div className="relative z-10 mb-auto flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-ember-grad text-black shadow-ember-sm">
            <Flame size={16} />
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.32em] text-text">Forge</span>
        </div>

        {/* Payload */}
        <div className="relative z-10 flex flex-1 flex-col justify-center py-6">
          {data.kind === 'roast' ? (
            <>
              <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-ember-1">
                {data.coachEmoji && <span className="text-base leading-none">{data.coachEmoji}</span>}
                {data.coachName}
              </div>
              <p className="font-display text-[27px] font-bold leading-[1.15] text-text [text-wrap:balance]">
                <span className="text-gradient-ember">“</span>
                {data.quote}
                <span className="text-gradient-ember">”</span>
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-ember-1">
                You got stronger
              </div>
              <div className="num font-display text-[68px] font-bold leading-none text-gradient-ember">
                {data.headline}
              </div>
              <div className="mt-2 font-display text-3xl font-bold leading-tight text-text">{data.subject}</div>
              {data.detail && <div className="num mt-3 text-sm font-medium text-text-dim">{data.detail}</div>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto flex items-center justify-between border-t border-ember-2/20 pt-4">
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-text-faint">
            {data.kind === 'roast' ? 'Stop starting over' : 'Load on the bar'}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ember-1">forge</span>
        </div>
      </div>
    );
  },
);
