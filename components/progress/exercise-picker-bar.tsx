'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Ex = { id: string; slug: string; name: string };

export function ExercisePickerBar({ exercises, selectedSlug }: { exercises: Ex[]; selectedSlug?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  function pick(slug: string) {
    router.push(`/progress?ex=${slug}`, { scroll: false });
  }

  return (
    <div className="mb-3">
      <div className="relative mb-2">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${exercises.length} lifts…`}
          className="h-10 pl-9 pr-9 text-sm"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="tap absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-faint"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex max-h-[124px] flex-wrap gap-1.5 overflow-y-auto pr-0.5">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => pick(e.slug)}
            className={cn(
              'tap shrink-0 whitespace-nowrap rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors',
              selectedSlug === e.slug ? 'border-ember-2/40 bg-ember-2/12 text-ember-1' : 'border-border surface-2 text-text-dim',
            )}
          >
            {e.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <span className="px-1 py-2 text-sm text-text-faint">No lifts match “{query}”.</span>
        )}
      </div>
    </div>
  );
}
