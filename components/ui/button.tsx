'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'tap inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 select-none focus-visible:outline-ice',
  {
    variants: {
      variant: {
        primary:
          'bg-ember-grad text-black font-semibold shadow-ember-sm hover:brightness-105',
        mint: 'bg-mint text-black font-semibold hover:brightness-105',
        surface:
          'surface-2 text-text border border-border hover:bg-[var(--border)]',
        ghost: 'text-text-dim hover:text-text hover:surface-2',
        outline: 'border border-border text-text hover:surface-2',
        danger: 'bg-ember-3/15 text-ember-3 border border-ember-3/30 hover:bg-ember-3/25',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-sm min-w-[44px]',
        lg: 'h-14 px-6 text-base min-w-[44px]',
        icon: 'h-11 w-11',
        'icon-lg': 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'surface',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
