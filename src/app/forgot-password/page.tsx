'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthFrame, FormError } from '@/components/app-shell/auth-frame';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthFrame title="Check your email" description={<>If an account exists for {email}, a reset link has been sent.</>}>
        <a href="/sign-in" className="text-sm text-foreground underline decoration-foreground/30 hover:decoration-foreground">
          Back to sign in
        </a>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title={<>Reset your password</>}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <FormError>{error}</FormError>}
            <Button type="submit" size="lg" className="w-full">Send reset link</Button>
          </form>
        </AuthFrame>
  );
}
