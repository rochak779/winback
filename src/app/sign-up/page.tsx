'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthFrame, FormError } from '@/components/app-shell/auth-frame';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpWithRedirect } from '@/lib/auth/sign-up';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const supabase = createBrowserSupabaseClient();
    const { data, error: signUpError } = await signUpWithRedirect(supabase, email, password, window.location.origin);
    setPending(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    // With Supabase's default "confirm email" setting, signUp returns no session
    // and every protected route would bounce back to /sign-in. Say so instead.
    if (!data.session) {
      setNotice('Check your email to confirm your account before signing in.');
      return;
    }
    router.push('/onboarding');
  }

  return (
    <AuthFrame title={<>Create your account</>}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <FormError>{error}</FormError>}
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? 'Creating account…' : 'Sign up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <a href="/sign-in" className="text-foreground underline decoration-foreground/30 hover:decoration-foreground">Sign in</a>
            </p>
          </form>
        </AuthFrame>
  );
}
