'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthFrame, FormError } from '@/components/app-shell/auth-frame';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // null = still checking, true/false = confirmed. Supabase puts the recovery
  // session in this browser's storage, so a link opened elsewhere has none.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    createBrowserSupabaseClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setHasSession(Boolean(data.session));
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push('/sign-in');
  }

  return (
    <AuthFrame title={<>Set a new password</>}>
          {hasSession === null && <p className="text-sm text-muted-foreground">Checking your reset link…</p>}
          {hasSession === false && (
            <p className="text-sm text-muted-foreground">
              This link must be opened in the same browser you requested it from.{' '}
              <a href="/forgot-password" className="text-foreground underline decoration-foreground/30 hover:decoration-foreground">Request a new link.</a>
            </p>
          )}
          {hasSession === true && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <FormError>{error}</FormError>}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
          )}
        </AuthFrame>
  );
}
