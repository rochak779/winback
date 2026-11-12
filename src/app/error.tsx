// ============================================================================
// src/app/error.tsx — erd.md Part 6 §6.3
//
// Next's App Router error boundary for this segment tree. Catches
// unexpected render-time exceptions; per-stage API errors are handled
// inline by each screen instead (they're expected, not exceptional).
// ============================================================================

'use client';

import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 border-t-2 border-rule px-4 pt-6 pb-24 sm:mt-16">
      <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em]">Something went wrong</h1>
      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
