import type { SupabaseClient } from '@supabase/supabase-js';

// The shared Supabase project's Site URL belongs to another app, so the
// confirmation email must be told to come back to WinBack explicitly.
export function signUpWithRedirect(supabase: SupabaseClient, email: string, password: string, origin: string) {
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/sign-in` } });
}
