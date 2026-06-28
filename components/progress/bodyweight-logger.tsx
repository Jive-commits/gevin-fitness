'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { logBodyweight } from '@/app/actions/settings';
import { displayToKg, type Units } from '@/lib/units';

export function BodyweightLogger({ units }: { units: Units }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [pending, startTransition] = useTransition();

  function save() {
    const n = parseFloat(val.replace(',', '.'));
    if (!(n > 0)) return;
    startTransition(async () => {
      await logBodyweight(displayToKg(n, units));
      setOpen(false);
      setVal('');
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="tap inline-flex items-center gap-1.5 rounded-pill border border-border surface-2 px-3 py-1.5 text-[13px] font-medium text-text-dim"
      >
        <Plus size={14} /> Log
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} title="Log bodyweight">
        <div className="space-y-4 py-1">
          <div className="flex items-center gap-2">
            <Input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              autoFocus
              className="num h-14 flex-1 text-center text-2xl"
            />
            <span className="text-lg font-medium text-text-dim">{units}</span>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={save} disabled={pending || !val}>
            {pending ? <Loader2 className="animate-spin" size={18} /> : 'Save'}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
