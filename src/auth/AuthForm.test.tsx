// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const auth = vi.hoisted(() => ({
  signUp: vi.fn(async () => ({ ok: true as const, needsConfirmation: true })),
  signIn: vi.fn(async () => ({ ok: true as const, needsConfirmation: false })),
}));

vi.mock('./AuthContext', () => ({ useAuth: () => auth }));

import { AuthForm } from './AuthForm';

afterEach(() => {
  cleanup();
  auth.signUp.mockClear();
  auth.signIn.mockClear();
});

function fill(password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.ac.uk' } });
  fireEvent.change(screen.getByLabelText(/^password/i, { selector: 'input' }), { target: { value: password } });
}

describe('auth form password policy', () => {
  it('blocks account creation with a weak password', async () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fill('weakpass1');
    fireEvent.click(screen.getByLabelText(/I.m 18 or over/));
    fireEvent.submit(screen.getAllByRole('button', { name: 'Create account' })[1]!.closest('form')!);
    expect((await screen.findByRole('alert')).textContent).toMatch(/capital letter/i);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('creates the account once every rule is met', async () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fill('Str0ng!pass');
    fireEvent.click(screen.getByLabelText(/I.m 18 or over/));
    fireEvent.submit(screen.getAllByRole('button', { name: 'Create account' })[1]!.closest('form')!);
    await waitFor(() => expect(auth.signUp).toHaveBeenCalled());
  });

  it('does not apply the policy to sign-in, so legacy passwords still work', async () => {
    render(<AuthForm />);
    fill('abc123');
    fireEvent.submit(screen.getAllByRole('button', { name: 'Sign in' })[1]!.closest('form')!);
    await waitFor(() => expect(auth.signIn).toHaveBeenCalled());
  });
});
