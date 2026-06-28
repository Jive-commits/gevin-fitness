import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  eyebrow,
  children,
  className,
  sticky = true,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode; // right-aligned actions
  className?: string;
  sticky?: boolean;
}) {
  return (
    <header
      className={cn(
        'z-20 border-b border-border bg-bg/80 px-5 pb-3 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-text-faint">
              {eyebrow}
            </div>
          )}
          <h1 className="truncate font-display text-2xl font-bold leading-tight">{title}</h1>
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
