// ============================================================================
// src/components/app-shell/page-header.tsx
//
// The IC Memo page masthead: serif title, one-line standfirst, an optional
// right-hand slot (status, primary action), closed by a heavy ink rule.
// ============================================================================

import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  aside,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-rule pb-6',
        className,
      )}
    >
      <div className="max-w-[62ch] space-y-2.5">
        <h1 className="font-heading text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[2.75rem]">
          {title}
        </h1>
        {description && <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {aside && <div className="flex shrink-0 flex-wrap items-center gap-3">{aside}</div>}
    </header>
  );
}

/** Calm inline status line for a running stage — staged copy, never a centred spinner. */
export function StatusNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 border-y border-border py-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-attention opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-attention" />
      </span>
      {children}
    </div>
  );
}

/** Inline error with a recovery action. */
export function ErrorNote({
  message,
  action,
  className,
}: {
  message: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-sm border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive',
        className,
      )}
    >
      <p>{message}</p>
      {action}
    </div>
  );
}

/** Small section label used above grouped content (not above headings). */
export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[0.8125rem] font-semibold text-muted-foreground', className)}>{children}</p>;
}

/** A prerequisite or empty state: what's missing and how to get it. */
export function EmptyNote({
  title,
  children,
  action,
  className,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex max-w-xl flex-col items-start gap-4 border-t-2 border-rule pt-6', className)}>
      <div className="space-y-1.5">
        <p className="font-heading text-2xl font-semibold tracking-[-0.01em]">{title}</p>
        {children && <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{children}</p>}
      </div>
      {action}
    </div>
  );
}
