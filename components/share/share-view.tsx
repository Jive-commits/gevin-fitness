'use client';

import { useMemo, useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { ShareCard, type ShareCardData } from '@/components/share/share-card';
import { cn } from '@/lib/utils';

export type ShareViewProps = {
  roast: (ShareCardData & { kind: 'roast' }) | null;
  recap: (ShareCardData & { kind: 'recap' }) | null;
};

/** The plain-text payload shared/copied alongside the screenshot. */
function shareText(data: ShareCardData): string {
  if (data.kind === 'roast') return `${data.coachName}:\n“${data.quote}”\n\n— Forge`;
  const detail = data.detail ? `\n${data.detail}` : '';
  return `${data.headline} ${data.subject} this week.${detail}\n\n— Forge`;
}

export function ShareView({ roast, recap }: ShareViewProps) {
  // Prefer the roast when it exists (it's the screenshot bait); otherwise recap.
  const [mode, setMode] = useState<'roast' | 'recap'>(roast ? 'roast' : 'recap');
  const [copied, setCopied] = useState(false);

  const data = mode === 'roast' ? roast : recap;
  const text = useMemo(() => (data ? shareText(data) : ''), [data]);

  async function onShare() {
    if (!data) return;
    const payload = { title: 'Forge', text };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to copy
    }
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* nothing else we can do */
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="flex flex-col gap-5">
      {/* Roast / Recap toggle (only when both exist) */}
      {roast && recap && (
        <div className="flex items-center justify-center gap-2">
          <Chip active={mode === 'roast'} tone="ember" onClick={() => setMode('roast')}>
            Roast
          </Chip>
          <Chip active={mode === 'recap'} tone="ember" onClick={() => setMode('recap')}>
            Recap
          </Chip>
        </div>
      )}

      {data ? (
        <ShareCard data={data} />
      ) : (
        <div className="mx-auto flex aspect-[9/16] w-full max-w-[360px] items-center justify-center rounded-card border border-border bg-surface p-6 text-center text-sm text-text-faint">
          Train a session and your coach a few times — then there&apos;ll be something worth posting.
        </div>
      )}

      {data && (
        <button
          onClick={onShare}
          className={cn(
            'tap mx-auto flex w-full max-w-[360px] items-center justify-center gap-2 rounded-pill bg-ember-grad px-6 py-3.5 text-sm font-semibold text-black shadow-ember-sm',
          )}
        >
          {copied ? (
            <>
              <Check size={16} /> Copied to clipboard
            </>
          ) : canShare ? (
            <>
              <Share2 size={16} /> Share
            </>
          ) : (
            <>
              <Copy size={16} /> Copy
            </>
          )}
        </button>
      )}
    </div>
  );
}
