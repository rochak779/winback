// ============================================================================
// src/components/decision/crosscheck-card.tsx — erd.md Part 6 §6.7
//
// The most important component in the build. Neutral status pill, the
// quantification as the visual centrepiece, and analyst accept/dismiss/edit
// controls that are actually wired to state (Part 1 Rule 3 — WinBack never
// issues a verdict; the analyst stays in the loop).
//
// Laid out as an IC-memo finding: the claim as a pull quote, the records as
// numbered exhibits, the gap as large serif figures marked with highlighter.
// ============================================================================

'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon, FileTextIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DerivedMarker } from '@/components/audit/derived-marker';
import { EvidenceChip } from '@/components/evidence/evidence-chip';
import { FieldLabel } from '@/components/app-shell/page-header';
import { WORKSTREAM_LABEL, CROSSCHECK_STATUS_LABEL } from '@/lib/labels';
import { useRun } from '@/lib/store/RunProvider';
import { useEvidenceDrawer } from '@/lib/store/EvidenceDrawerProvider';
import { recordAuditEvent } from '@/lib/client/api';
import { cn } from '@/lib/utils';
import type { Crosscheck } from '@/lib/contracts/types';

function statusClass(status: Crosscheck['status']): string {
  if (status === 'contradiction_found') return 'bg-highlight text-attention-foreground';
  if (status === 'consistent') return 'border border-border text-muted-foreground';
  return 'bg-muted text-muted-foreground';
}

function fmtFigure(n: number, unit: string): { value: string; suffix: string } {
  if (unit === '%') return { value: `${Number.isInteger(n) ? n : n.toFixed(1)}`, suffix: '%' };
  return { value: n.toLocaleString('en-US'), suffix: unit ? ` ${unit}` : '' };
}

function fmtGap(claimed: number, observed: number, unit: string): { value: string; suffix: string } {
  const gap = Math.abs(claimed - observed);
  // A difference between two percentages is measured in percentage points.
  if (unit === '%') return { value: gap.toFixed(1), suffix: ' pts' };
  return { value: gap.toLocaleString('en-US'), suffix: unit ? ` ${unit}` : '' };
}

function Figure({
  label,
  value,
  suffix,
  marked,
  children,
}: {
  label: string;
  value: string;
  suffix: string;
  marked?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'flex items-start gap-2 font-heading text-[2.75rem] leading-none font-medium tracking-[-0.02em] tabular-nums sm:text-[3.25rem]',
          marked && 'font-semibold text-attention-foreground',
        )}
      >
        <span className={cn('min-w-0 break-words', marked && 'marker')}>
          {value}
          <span className="text-[0.45em] font-medium tracking-normal">{suffix}</span>
        </span>
        {children}
      </p>
    </div>
  );
}

export function CrosscheckCard({ crosscheck }: { crosscheck: Crosscheck }) {
  const { run, dispatch } = useRun();
  const { open } = useEvidenceDrawer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(crosscheck.analystNote ?? crosscheck.suggestedMemoLanguage);

  function setDecision(decision: 'accepted' | 'dismissed') {
    dispatch({ type: 'CROSSCHECK_DECISION', crosscheckId: crosscheck.id, decision });
    recordAuditEvent({
      runId: run.id,
      action: decision === 'accepted' ? 'analyst_accepted' : 'analyst_dismissed',
      stage: 'decision',
      statementId: crosscheck.statementId,
      statementText: crosscheck.explanation,
    });
  }

  function saveEdit() {
    dispatch({ type: 'CROSSCHECK_DECISION', crosscheckId: crosscheck.id, decision: 'accepted', note: draft });
    recordAuditEvent({
      runId: run.id,
      action: 'analyst_edited',
      stage: 'decision',
      statementId: crosscheck.statementId,
      before: crosscheck.analystNote ?? crosscheck.suggestedMemoLanguage,
      after: draft,
    });
    setEditing(false);
  }

  async function copyLanguage() {
    await navigator.clipboard.writeText(crosscheck.analystNote ?? crosscheck.suggestedMemoLanguage);
    toast.success('Copied to clipboard');
  }

  const q = crosscheck.quantification;
  const isPct = q?.unit === '%';
  const decided = crosscheck.analystDecision !== 'pending';

  return (
    <article className="space-y-8 border-t-2 border-rule pt-7 animate-in fade-in duration-300 first:border-t-0 first:pt-0">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.8125rem]">
          <span className="font-medium text-foreground/80">
            {WORKSTREAM_LABEL[crosscheck.workstream] ?? crosscheck.workstream}
          </span>
          <span aria-hidden="true" className="text-input">
            ·
          </span>
          <span className={cn('rounded-xs px-2 py-px font-medium', statusClass(crosscheck.status))}>
            {CROSSCHECK_STATUS_LABEL[crosscheck.status] ?? crosscheck.status}
          </span>
          {decided && (
            <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-foreground">
              {crosscheck.analystDecision === 'accepted' ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <XIcon className="size-3.5" />
              )}
              {crosscheck.analystDecision === 'accepted' ? 'Accepted into memo' : 'Dismissed'} by analyst
            </span>
          )}
        </div>
        <h2 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] sm:text-[2rem]">
          {crosscheck.title}
        </h2>
      </header>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <section className="space-y-3">
          <FieldLabel>Management’s claim</FieldLabel>
          <blockquote className="font-heading text-xl leading-normal italic sm:text-[1.3125rem]">
            &ldquo;{crosscheck.claim.text}&rdquo;
          </blockquote>
          <EvidenceChip refs={crosscheck.claim.evidence} label="Source" />
        </section>

        {crosscheck.counterEvidence.length > 0 && (
          <section className="space-y-3">
            <FieldLabel>What the records show</FieldLabel>
            <ol className="divide-y divide-border border-y border-border">
              {crosscheck.counterEvidence.map((ref, i) => {
                const doc = run.docs.find((d) => d.id === ref.docId);
                return (
                  <li key={`${ref.docId}-${ref.blockId}`}>
                    <button
                      type="button"
                      onClick={() => open(crosscheck.counterEvidence, i)}
                      className="group flex w-full items-baseline gap-3 py-2.5 text-left text-sm transition-colors hover:bg-highlight/40 focus-visible:bg-highlight/40 focus-visible:outline-none"
                    >
                      <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2">{ref.note ?? ref.quote}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <FileTextIcon className="size-3" aria-hidden="true" />
                          {doc?.title ?? ref.docId} · {doc?.pageNoun ?? 'page'} {ref.page}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>

      {q && (
        <figure className="space-y-6 border-y border-border py-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Figure label="Claimed" {...fmtFigure(q.claimedValue, q.unit)} />
            <Figure label="Observed" {...fmtFigure(q.observedValue, q.unit)}>
              <DerivedMarker formula={q.label} inputs={[q.note]} className="mt-1.5 size-6 text-xs" />
            </Figure>
            <Figure label="Gap" marked {...fmtGap(q.claimedValue, q.observedValue, q.unit)} />
          </div>

          {isPct && (
            <div aria-hidden="true" className="space-y-1.5">
              <div className="relative h-3.5 bg-accent">
                <div
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{ width: `${Math.min(q.observedValue, q.claimedValue)}%` }}
                />
                <div
                  className="hatch-attention absolute inset-y-0"
                  style={{
                    left: `${Math.min(q.observedValue, q.claimedValue)}%`,
                    width: `${Math.abs(q.claimedValue - q.observedValue)}%`,
                  }}
                />
                <div
                  className="absolute -inset-y-1.5 w-0.5 bg-primary"
                  style={{ left: `${Math.max(q.observedValue, q.claimedValue)}%` }}
                />
              </div>
              <div className="relative h-4 text-[0.6875rem] text-muted-foreground tabular-nums">
                <span className="absolute left-0">0%</span>
                <span
                  className="absolute -translate-x-1/2"
                  style={{ left: `${Math.min(q.observedValue, q.claimedValue)}%` }}
                >
                  {Math.min(q.observedValue, q.claimedValue)}
                </span>
                <span
                  className="absolute -translate-x-1/2"
                  style={{ left: `${Math.max(q.observedValue, q.claimedValue)}%` }}
                >
                  {Math.max(q.observedValue, q.claimedValue)}
                </span>
                <span className="absolute right-0">100%</span>
              </div>
            </div>
          )}

          <figcaption className="max-w-[72ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
            {q.note}
          </figcaption>
        </figure>
      )}

      <div className="max-w-[70ch] space-y-2.5">
        <p className="text-base leading-[1.7]">{crosscheck.explanation}</p>
        <p className="text-[0.8125rem] text-muted-foreground">Model severity hint: {crosscheck.severityHint}</p>
      </div>

      <section className="space-y-2.5">
        <FieldLabel>Suggested memo language</FieldLabel>
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="font-heading text-[1.0625rem] leading-relaxed"
            />
            <div className="flex gap-2">
              <Button onClick={saveEdit}>Save and accept</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 rounded-sm border border-border bg-card px-5 py-5 shadow-sheet sm:px-6">
            <p className="max-w-[68ch] flex-1 font-heading text-[1.0625rem] leading-relaxed sm:text-lg">
              {crosscheck.analystNote ?? crosscheck.suggestedMemoLanguage}
            </p>
            <Button size="icon" variant="outline" onClick={copyLanguage} aria-label="Copy suggested language">
              <CopyIcon />
            </Button>
          </div>
        )}
      </section>

      {!editing && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            variant={crosscheck.analystDecision === 'accepted' ? 'default' : decided ? 'outline' : 'default'}
            onClick={() => setDecision('accepted')}
            aria-pressed={crosscheck.analystDecision === 'accepted'}
          >
            <CheckIcon /> Accept into memo
          </Button>
          <Button
            size="lg"
            variant={crosscheck.analystDecision === 'dismissed' ? 'default' : 'outline'}
            onClick={() => setDecision('dismissed')}
            aria-pressed={crosscheck.analystDecision === 'dismissed'}
          >
            <XIcon /> Dismiss
          </Button>
          <Button size="lg" variant="link" onClick={() => setEditing(true)}>
            Edit wording
          </Button>
        </div>
      )}
    </article>
  );
}
