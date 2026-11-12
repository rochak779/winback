// ============================================================================
// src/app/deal/[id]/decision/page.tsx — Screen 4: Decision (erd.md Part 6 §6.7)
// ============================================================================

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CrosscheckCard } from '@/components/decision/crosscheck-card';
import { ComingSoonCard } from '@/components/decision/coming-soon-card';
import { MemoCard } from '@/components/decision/memo-card';
import { EmptyNote, ErrorNote, PageHeader, StatusNote } from '@/components/app-shell/page-header';
import { runCrosscheck, runMemo } from '@/lib/client/api';
import { useRun, useStage } from '@/lib/store/RunProvider';
import type { SourceDocId } from '@/lib/contracts/types';

export default function DecisionPage() {
  const { run, dispatch } = useRun();
  const decisionStage = useStage('decision');
  const memoStage = useStage('memo');
  const startedRef = useRef(false);

  const docIds = run.docs.map((d) => d.id) as SourceDocId[];

  function start() {
    if (!run.extraction) return;
    void runCrosscheck(dispatch, run.id, docIds, run.extraction.profile);
  }

  function draftMemo() {
    if (!run.deal || !run.extraction || !run.benchmark || !run.portfolio || !run.decision) return;
    void runMemo(
      dispatch,
      run.id,
      run.deal,
      run.extraction.profile,
      run.benchmark,
      run.portfolio,
      run.decision.crosschecks
    );
  }

  useEffect(() => {
    if (startedRef.current) return;
    if (decisionStage.status !== 'idle') return;
    if (!run.extraction) return;
    startedRef.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionStage.status, run.extraction]);

  const crosschecks = run.decision?.crosschecks ?? [];
  const reviewed = crosschecks.filter((c) => c.analystDecision !== 'pending').length;

  if (!run.extraction) {
    return (
      <EmptyNote
        title="Nothing to cross-check yet"
        action={
          <Button nativeButton={false} render={<Link href={`/deal/${run.id}/ingest`} />}>
            Go to Ingest
          </Button>
        }
      >
        Run extraction first. The crosscheck needs the extracted profile.
      </EmptyNote>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader
        title="Decision"
        description="Claims cross-checked against the underlying records. WinBack states the gap; the analyst decides what it means."
        aside={
          crosschecks.length > 0 && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
                <strong className="font-semibold text-foreground">
                  {reviewed} of {crosschecks.length}
                </strong>{' '}
                findings reviewed
              </span>
              <div aria-hidden="true" className="flex gap-1">
                {crosschecks.map((c) => (
                  <span
                    key={c.id}
                    className={c.analystDecision === 'pending' ? 'h-1 w-12 bg-border' : 'h-1 w-12 bg-primary'}
                  />
                ))}
              </div>
            </div>
          )
        }
      />

      {decisionStage.status === 'running' && (
        <StatusNote>Running both crosschecks against the source documents…</StatusNote>
      )}

      {decisionStage.status === 'error' && (
        <ErrorNote
          message={decisionStage.error?.message ?? 'Crosscheck failed.'}
          action={
            <Button variant="outline" size="sm" onClick={start}>
              Retry
            </Button>
          }
        />
      )}

      {run.decision && decisionStage.status === 'done' && (
        <>
          <div className="space-y-16">
            {run.decision.crosschecks.map((c) => (
              <CrosscheckCard key={c.id} crosscheck={c} />
            ))}
          </div>

          {run.decision.comingSoon.length > 0 && (
            <section className="space-y-4 border-t border-border pt-6">
              <h2 className="font-heading text-xl font-semibold">Other workstreams</h2>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                {run.decision.comingSoon.map((item) => (
                  <ComingSoonCard key={item.workstream} item={item} />
                ))}
              </div>
            </section>
          )}

          <div>
            {!run.memo && memoStage.status === 'idle' && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-card px-6 py-5 shadow-sheet">
                <div className="space-y-1">
                  <p className="font-heading text-xl font-semibold">Draft the IC memo</p>
                  <p className="text-sm text-muted-foreground">
                    WinBack drafts from the profile, the analysis and the findings you accepted.
                  </p>
                </div>
                <Button size="lg" onClick={draftMemo} disabled={!run.benchmark || !run.portfolio}>
                  Draft IC memo
                </Button>
              </div>
            )}
            
            {memoStage.status === 'running' && (
              <StatusNote>Drafting the IC memo…</StatusNote>
            )}
            
            {memoStage.status === 'error' && (
              <ErrorNote
                message={memoStage.error?.message ?? 'Memo generation failed.'}
                action={
                  <Button variant="outline" size="sm" onClick={draftMemo}>
                    Retry memo
                  </Button>
                }
              />
            )}

            {run.memo && memoStage.status === 'done' && <MemoCard />}
          </div>
        </>
      )}
    </div>
  );
}
