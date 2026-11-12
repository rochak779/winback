// ============================================================================
// src/app/page.tsx — Public landing page
//
// The only page unauthenticated visitors can reach at "/" (see PUBLIC_PATHS
// in src/proxy.ts). Hero + product summary, no data fetching. The
// authenticated dashboard lives at /dashboard.
// ============================================================================

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <span className="font-heading text-2xl font-semibold tracking-[-0.01em]">WinBack</span>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'link' }), 'px-0')}>
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center px-6 pb-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid w-full max-w-6xl gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <div className="space-y-8">
            <h1 className="max-w-[16ch] font-heading text-5xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              First-pass diligence, <span className="marker">with the evidence attached.</span>
            </h1>
            <p className="max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              WinBack reads the data room, cross-checks management&apos;s claims against the underlying records, and
              cites the source for every finding. The judgement stays with the deal team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>
                Create an account
              </Link>
              <Link href="/sign-in" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Sign in
              </Link>
            </div>
          </div>

          <dl className="divide-y divide-border border-y-2 border-rule">
            {[
              ['Extract', 'A structured company profile from scattered source documents.'],
              ['Benchmark', 'The target against peers, calculated in code, never by the model.'],
              ['Cross-check', 'Contradictions between the claims and the records, each linked to its source.'],
              ['Memo', 'An IC memo drafted only from findings an analyst has accepted.'],
            ].map(([term, detail]) => (
              <div key={term} className="grid grid-cols-[7.5rem_1fr] gap-4 py-4">
                <dt className="font-heading text-lg font-semibold">{term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  );
}
