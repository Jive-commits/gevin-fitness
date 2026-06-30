'use client';

import { useState, useEffect } from 'react';
import { EXERCISE_MEDIA } from '@/lib/exercise-media';
import { cn } from '@/lib/utils';

/**
 * Two-frame movement demo (start ↔ end position) from the public-domain
 * free-exercise-db, cross-faded to animate. Renders nothing when there's no
 * match (e.g. custom exercises). Loads directly from GitHub's CDN.
 */
export function ExerciseAnimation({ slug, name }: { slug: string; name: string }) {
  const frames = EXERCISE_MEDIA[slug];
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!frames || frames.length < 2) return;
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % frames.length), 1400);
    return () => clearInterval(id);
  }, [frames]);

  if (!frames || frames.length === 0 || !ok) return null;

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-white">
      <div className="relative aspect-[4/3] w-full">
        {frames.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${name} — demonstration frame ${idx + 1}`}
            onError={() => setOk(false)}
            loading="lazy"
            className={cn(
              'absolute inset-0 h-full w-full object-contain transition-opacity duration-500',
              idx === i ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>
      <span className="absolute right-2 top-2 rounded-pill bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur-sm">
        demo
      </span>
    </div>
  );
}
