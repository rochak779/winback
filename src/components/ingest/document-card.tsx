// ============================================================================
// src/components/ingest/document-card.tsx — erd.md Part 6 §6.5
// ============================================================================

'use client';

import { FileTextIcon, LoaderCircleIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvidenceDrawer } from '@/lib/store/EvidenceDrawerProvider';
import { WORKSTREAM_LABEL } from '@/lib/labels';
import type { DocClassification, SourceDoc } from '@/lib/contracts/types';

export function DocumentCard({
  doc,
  classification,
  status,
}: {
  doc: SourceDoc;
  classification: DocClassification | null;
  status: 'idle' | 'working' | 'done';
}) {
  const { open } = useEvidenceDrawer();
  const firstBlock = doc.blocks[0];

  function preview() {
    if (!firstBlock) return;
    open([{ docId: doc.id, blockId: firstBlock.id, page: firstBlock.page, quote: firstBlock.text, quoteVerified: true }]);
  }

  return (
    <Card size="sm" className="justify-between">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-start gap-2 text-base leading-snug">
            <FileTextIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {doc.title}
          </CardTitle>
          {status === 'working' && <LoaderCircleIcon className="size-4 shrink-0 animate-spin text-stage-active" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="font-mono text-[0.6875rem] break-all">
          {doc.filename} · {doc.pages} {doc.pageNoun}
          {doc.pages === 1 ? '' : 's'}
        </div>
        {status === 'working' ? (
          <Skeleton className="h-4 w-24" />
        ) : classification ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{WORKSTREAM_LABEL[classification.workstream] ?? classification.workstream}</Badge>
            <span>{Math.round(classification.confidence * 100)}% confidence</span>
            <span>· {classification.fieldsExtracted} fields</span>
          </div>
        ) : (
          <Badge variant="outline">Unclassified</Badge>
        )}
        <button
          type="button"
          onClick={preview}
          className="block text-[0.8125rem] font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Preview document
        </button>
      </CardContent>
    </Card>
  );
}
