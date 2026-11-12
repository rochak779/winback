import type { ComingSoonWorkstream } from '@/lib/contracts/types';

/** A workstream outside this release: present for scope, visibly inert. */
export function ComingSoonCard({ item }: { item: ComingSoonWorkstream }) {
  return (
    <div className="space-y-1.5 border-t border-border pt-3 text-muted-foreground" aria-disabled="true">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-heading text-base font-semibold text-foreground/60">{item.label}</p>
        <span className="shrink-0 text-[0.6875rem]">Not in this release</span>
      </div>
      <p className="text-xs leading-relaxed">{item.description}</p>
    </div>
  );
}
