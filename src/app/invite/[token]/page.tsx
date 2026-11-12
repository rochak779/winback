'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthFrame, FormError } from '@/components/app-shell/auth-frame';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { acceptInvite, getInvitePreview, type InvitePreview } from '@/lib/org/invites';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [preview, setPreview] = useState<InvitePreview | null | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvitePreview(supabase as never, token).then(setPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAccept() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }
    const result = await acceptInvite(supabase as never, token);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    router.push('/');
  }

  if (preview === 'loading') return null;
  if (preview === null) {
    return (
      <AuthFrame title="Invite not found" description="This invite link is invalid or has expired. Ask the person who invited you for a new one.">
        <a href="/sign-in" className="text-sm text-foreground underline decoration-foreground/30 hover:decoration-foreground">
          Go to sign in
        </a>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title={<>Join {preview.orgName}</>}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited as {preview.role === 'admin' ? 'an admin' : 'a member'}.
          </p>
          {error && <FormError>{error}</FormError>}
          <Button size="lg" className="w-full" onClick={handleAccept} disabled={preview.status !== 'pending'}>
            {preview.status === 'pending' ? 'Accept invite' : 'Already accepted'}
          </Button>
        </div>
      </AuthFrame>
  );
}
