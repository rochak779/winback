// ============================================================================
// src/components/app-shell/sidebar.tsx
//
// Persistent left rail in the IC Memo style: serif wordmark, the active deal,
// and the pipeline stages with their completion state, so the analyst can
// see where the deal stands without leaving the page they're on. Collapses
// to a horizontal strip on narrow screens.
// ============================================================================

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMockRun, useRun } from '@/lib/store/RunProvider';

type NavItem = {
  label: string;
  href: string;
  disabled: boolean;
  /** Right-hand marker: a completed stage, or a review count. */
  meta?: 'done' | string;
};

export function Sidebar() {
  const { run } = useRun();
  const isMock = useIsMockRun();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await createBrowserSupabaseClient().auth.signOut();
    router.push('/sign-in');
  }

  const crosschecks = run.decision?.crosschecks ?? [];
  const reviewed = crosschecks.filter((c) => c.analystDecision !== 'pending').length;
  const noDeal = !run.deal;

  const workspace: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', disabled: false },
    { label: 'New deal', href: '/plan', disabled: false },
  ];
  const pipeline: NavItem[] = [
    { label: 'Ingest', href: `/deal/${run.id}/ingest`, disabled: noDeal, meta: run.extraction ? 'done' : undefined },
    {
      label: 'Analysis',
      href: `/deal/${run.id}/analysis`,
      disabled: noDeal,
      meta: run.benchmark && run.portfolio ? 'done' : undefined,
    },
    {
      label: 'Decision',
      href: `/deal/${run.id}/decision`,
      disabled: noDeal,
      meta: crosschecks.length > 0 ? `${reviewed} / ${crosschecks.length}` : undefined,
    },
    { label: 'Audit trail', href: `/deal/${run.id}/audit`, disabled: noDeal },
  ];
  const portfolio: NavItem[] = [{ label: 'Knowledge graph', href: '/graph', disabled: false }];

  function renderItem(item: NavItem) {
    const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
    if (item.disabled) {
      return (
        <li key={item.label}>
          <span
            className="flex items-center rounded-sm px-2.5 py-2 text-sm whitespace-nowrap text-muted-foreground/55"
            title="Create a deal first"
          >
            {item.label}
          </span>
        </li>
      );
    }
    return (
      <li key={item.label}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-sm whitespace-nowrap transition-colors',
            active
              ? 'bg-primary font-medium text-primary-foreground'
              : 'text-foreground/80 hover:bg-sidebar-accent hover:text-foreground',
          )}
        >
          {item.label}
          {item.meta === 'done' ? (
            <CheckIcon
              aria-label="Complete"
              className={cn('size-3.5 shrink-0', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}
            />
          ) : item.meta ? (
            <span
              className={cn(
                'text-xs tabular-nums',
                active ? 'text-primary-foreground/75' : 'text-muted-foreground',
              )}
            >
              {item.meta}
            </span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <nav
      aria-label="Primary"
      className="flex w-full shrink-0 flex-col gap-5 border-b border-sidebar-border bg-sidebar px-4 py-5 md:sticky md:top-0 md:h-dvh md:w-60 md:gap-7 md:border-r md:border-b-0 md:px-4 md:py-8"
    >
      <div className="flex items-start justify-between gap-4 px-2.5 md:flex-col md:items-stretch md:gap-4">
        <Link
          href="/dashboard"
          className="font-heading text-2xl leading-none font-semibold tracking-[-0.01em] text-foreground"
        >
          WinBack
        </Link>
        {run.deal && (
          <div className="min-w-0 space-y-0.5 text-right md:border-t md:border-sidebar-border md:pt-4 md:text-left">
            <p className="truncate font-heading text-[1.0625rem] leading-snug font-medium">{run.deal.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {run.docs.length > 0 ? `${run.docs.length} source documents` : run.deal.targetCompany}
            </p>
            {isMock && (
              <Badge
                variant="outline"
                className="mt-1.5 border-attention/50 bg-highlight text-attention-foreground"
              >
                Mock data
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:flex-1 md:overflow-visible md:px-0">
        <div className="flex gap-6 md:flex-col md:gap-5">
          <ul className="flex gap-0.5 md:flex-col">{workspace.map(renderItem)}</ul>
          <div className="flex items-start gap-1 md:block md:space-y-1.5">
            <p className="hidden px-2.5 text-xs font-medium text-muted-foreground md:block">This deal</p>
            <ul className="flex gap-0.5 md:flex-col">{pipeline.map(renderItem)}</ul>
          </div>
          <div className="flex items-start gap-1 md:block md:space-y-1.5">
            <p className="hidden px-2.5 text-xs font-medium text-muted-foreground md:block">Portfolio</p>
            <ul className="flex gap-0.5 md:flex-col">{portfolio.map(renderItem)}</ul>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="self-start px-2.5 text-[0.8125rem] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
      >
        Sign out
      </button>
    </nav>
  );
}
