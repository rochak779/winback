import { describe, expect, it, vi } from 'vitest';
import { signUpWithRedirect } from './sign-up';

describe('signUpWithRedirect', () => {
  it('sign-up passes emailRedirectTo', async () => {
    const fake = { auth: { signUp: vi.fn() } };
    await signUpWithRedirect(fake as never, 'a@b.co', 'pw123456', 'https://winback-1.vercel.app');
    expect(fake.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'pw123456',
      options: { emailRedirectTo: 'https://winback-1.vercel.app/sign-in' },
    });
  });
});
