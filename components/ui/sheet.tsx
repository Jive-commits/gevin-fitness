'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Disable the close button (e.g. mandatory flows). */
  hideClose?: boolean;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideClose,
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => e.preventDefault()}
              aria-describedby={undefined}
            >
              <motion.div
                className={cn(
                  'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col',
                  'rounded-t-[24px] border-t border-x border-border bg-surface',
                  'shadow-[0_-12px_50px_-12px_rgba(0,0,0,0.8)]',
                  className,
                )}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 380 }}
              >
                <div className="flex justify-center pt-3">
                  <div className="h-1 w-9 rounded-full bg-border" />
                </div>
                {(title || !hideClose) && (
                  <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
                    <div className="min-w-0">
                      {title && (
                        <Dialog.Title className="font-display text-lg font-semibold leading-tight">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-0.5 text-sm text-text-dim">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {!hideClose && (
                      <Dialog.Close
                        className="tap -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full surface-2 text-text-dim hover:text-text"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </Dialog.Close>
                    )}
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+var(--safe-bottom))] pt-1">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
