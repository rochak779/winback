// ============================================================================
// src/components/app-shell/auth-frame.tsx
//
// Shared frame for the signed-out pages (sign in, sign up, password reset,
// invites): an ink panel carrying the product's promise beside a paper
// panel holding the form. Stacks on narrow screens.
// ============================================================================

import Link from 'next/link';

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="flex flex-col justify-between gap-10 bg-primary px-6 py-8 text-primary-foreground sm:px-10 lg:px-14 lg:py-14">
        <Link href="/" className="font-heading text-2xl font-semibold tracking-[-0.01em]">
          WinBack
        </Link>
        <div className="hidden max-w-md space-y-5 lg:block">
          <p className="font-heading text-[2rem] leading-[1.2] font-medium tracking-[-0.015em]">
            Read the whole data room. Cross-check management&apos;s claims. Cite the evidence for every finding.
          </p>
          <p className="text-sm leading-relaxed text-primary-foreground/70">
            First-pass diligence for private equity deal teams. WinBack states the gap; your team decides what it
            means.
          </p>
        </div>
        <p className="hidden text-xs text-primary-foreground/55 lg:block">
          Every number is calculated in code or cited to an exact passage.
        </p>
      </aside>

      <div className="flex items-center justify-center px-4 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="font-heading text-[2rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
            {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Inline form error in the auth pages. */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-sm border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}
