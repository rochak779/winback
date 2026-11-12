'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon, PencilIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceChip } from '@/components/evidence/evidence-chip';
import { useRun } from '@/lib/store/RunProvider';
import { recordAuditEvent } from '@/lib/client/api';
import type { EvidenceRef } from '@/lib/contracts/types';

/** Renders the memo's markdown-lite body: paragraphs, and runs of '- ' lines as a bulleted list. */
function MemoBody({ body }: { body: string }) {
  const blocks: ({ kind: 'p'; text: string } | { kind: 'ul'; items: string[] })[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ul') last.items.push(line.slice(2));
      else blocks.push({ kind: 'ul', items: [line.slice(2)] });
    } else {
      blocks.push({ kind: 'p', text: line });
    }
  }
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === 'p' ? (
          <p key={i} className="mb-3 last:mb-0">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="mb-3 list-disc space-y-1.5 pl-5 marker:text-muted-foreground last:mb-0">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

function MemoSection({
  section,
  onEdit,
}: {
  section: { id: string; heading: string; body: string; evidence: EvidenceRef[]; originalBody: string | null };
  onEdit: (id: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.body);

  function saveEdit() {
    onEdit(section.id, draft);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(section.body);
    setEditing(false);
  }

  return (
    <section className="space-y-3 border-b border-border pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-semibold tracking-[-0.01em]">{section.heading}</h3>
        {!editing && (
          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit section">
            <PencilIcon />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 mt-3">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="font-heading text-base leading-relaxed" />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 max-w-[68ch] font-heading text-[1.0625rem] leading-[1.7] text-foreground/90">
          <MemoBody body={section.body} />
        </div>
      )}

      {section.evidence && section.evidence.length > 0 && !editing && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {section.evidence.map((ref, i) => (
            <EvidenceChip key={`${ref.docId}-${ref.blockId}`} refs={section.evidence} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

export function MemoCard() {
  const { run, dispatch } = useRun();
  const memo = run.memo;

  if (!memo) return null;

  function editSection(id: string, body: string) {
    const section = memo?.sections.find((s) => s.id === id);
    dispatch({ type: 'MEMO_EDIT_SECTION', sectionId: id, body });
    if (section) {
      recordAuditEvent({
        runId: run.id,
        action: 'analyst_edited',
        stage: 'memo',
        statementId: section.statementId,
        before: section.body,
        after: body,
      });
    }
  }

  function setStatus(status: 'draft' | 'analyst_edited' | 'approved') {
    dispatch({ type: 'MEMO_STATUS', status });
    recordAuditEvent({ runId: run.id, action: 'memo_status_changed', stage: 'memo', note: `Memo marked ${status}` });
    toast.success(`Memo marked as ${status.replace('_', ' ')}`);
  }

  async function copyMemo() {
    if (!memo) return;
    const text = memo.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success('Memo copied to clipboard');
  }

  return (
    <Card className="mt-4 gap-0 py-0 animate-in fade-in duration-300">
      <CardHeader className="border-b-2 border-rule px-6 pt-8 pb-6 sm:px-12 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Investment Committee Memo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {run.deal ? `${run.deal.name}. ` : ''}Drafted from verified findings and selected insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={memo.status === 'approved' ? 'border-primary bg-primary text-primary-foreground' : 'bg-card'}
            >
              {memo.status === 'approved' ? 'Approved' : memo.status === 'analyst_edited' ? 'Analyst edited' : 'Draft'}
            </Badge>
            <Button size="sm" variant="outline" onClick={copyMemo}>
              <CopyIcon /> Copy full memo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 px-6 py-10 sm:px-12">
        {memo.sections.map((section) => (
          <MemoSection key={section.id} section={section} onEdit={editSection} />
        ))}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-5 sm:px-12">
        <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">{memo.disclaimer}</p>
        <div className="flex gap-2">
          {memo.status !== 'approved' && (
            <Button onClick={() => setStatus('approved')}>
              <CheckIcon /> Approve for IC
            </Button>
          )}
          {memo.status === 'approved' && (
            <Button variant="outline" onClick={() => setStatus('analyst_edited')}>
              <XIcon /> Revoke approval
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
