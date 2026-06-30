import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[84px] w-full resize-none rounded-xl surface-2 border border-border px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice focus-visible:border-ice',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
