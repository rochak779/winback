// ============================================================================
// src/app/dashboard/page.tsx — Dashboard
//
// Landing page after sign-in/onboarding. Surfaces real data:
// the org's tracked companies (src/data/target's onboarding-created
// `companies` rows) and the documents uploaded against each in Supabase
// Storage's `winback-documents` bucket. No extraction pipeline wiring yet —
// see docs/superpowers/specs/2026-09-05-auth-onboarding-foundation-design.md.
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { FileTextIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyNote, PageHeader } from '@/components/app-shell/page-header';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { DOCUMENTS_BUCKET } from '@/lib/supabase/schema';
import { getUserOrgs } from '@/lib/org/membership';

interface CompanyRow {
  id: string;
  name: string;
  files: string[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createBrowserSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const orgs = await getUserOrgs(supabase as never, userData.user.id);
      const org = orgs[0];
      if (!org) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) setOrgName(org.orgName);

      const { data: companyRows } = await supabase.from('companies').select('id, name').eq('org_id', org.orgId);
      const rows: CompanyRow[] = [];
      for (const company of companyRows ?? []) {
        const { data: files } = await supabase.storage.from(DOCUMENTS_BUCKET).list(`${org.orgId}/${company.id}`);
        rows.push({ id: company.id, name: company.name, files: (files ?? []).map((file) => file.name) });
      }
      if (!cancelled) {
        setCompanies(rows);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Dashboard"
        description={orgName ? `${orgName}: companies you track and the documents on file for each.` : undefined}
        aside={
          <Link href="/plan" className={buttonVariants({ size: 'lg' })}>
            New deal →
          </Link>
        }
      />

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2" role="status" aria-label="Loading companies">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {!loading && companies.length === 0 && (
        <EmptyNote title="No companies tracked yet" className="border-t-0 pt-0">
          Companies you add during onboarding appear here with their uploaded documents.
        </EmptyNote>
      )}

      {!loading && companies.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle className="text-xl">{company.name}</CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {company.files.length} {company.files.length === 1 ? 'document' : 'documents'}
                </p>
              </CardHeader>
              <CardContent>
                {company.files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                ) : (
                  <ul className="divide-y divide-border border-y border-border text-sm">
                    {company.files.map((fileName) => (
                      <li key={fileName} className="flex items-center gap-2 py-2">
                        <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{fileName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
