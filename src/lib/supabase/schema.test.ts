import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({})),
  createServerClient: vi.fn(() => ({})),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}));

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createBrowserSupabaseClient } from './client';
import { createServerSupabaseClient } from './server';

describe('Supabase clients', () => {
  it('browser client targets the winback schema', () => {
    createBrowserSupabaseClient();
    const options = vi.mocked(createBrowserClient).mock.lastCall?.[2];
    expect(options).toMatchObject({ db: { schema: 'winback' } });
  });

  it('server client targets the winback schema', async () => {
    await createServerSupabaseClient();
    const options = vi.mocked(createServerClient).mock.lastCall?.[2];
    expect(options?.db?.schema).toBe('winback');
    expect(typeof options?.cookies.getAll).toBe('function');
  });
});
