import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { WEAK_PASSWORD_MESSAGE, isStrongPassword } from './passwordRules';

export interface AuthUser {
  id: string;
  email: string;
  /**
   * False until the learner has been shown the licence-code / plans page once. Stored as
   * `onboarded_at` in auth user metadata, so it follows the account across devices — the
   * confirmation email is often opened somewhere other than where they signed up.
   */
  onboarded: boolean;
}

/** Accounts created before the onboarding step shipped are treated as already onboarded. */
const ONBOARDING_LAUNCHED_AT = Date.parse('2026-09-30T00:00:00Z');

export type AuthResult = { ok: true; needsConfirmation: boolean } | { ok: false; message: string };

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the first session lookup resolves — pages must not flash "signed out". */
  initialising: boolean;
  /**
   * `acceptedTerms` is the Terms version the learner ticked (`TERMS_VERSION` in
   * `shared/legal/business.ts`). It travels as auth user metadata with the time it was accepted,
   * which is the record of the contract being formed — no schema change needed.
   */
  signUp(email: string, password: string, acceptedTerms: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  /** Records that the post-sign-up plans / licence-code page has been shown. */
  markOnboarded(): Promise<void>;
  signOut(): Promise<void>;
  /**
   * Permanent self-service deletion (UK GDPR): the server-side rpc removes the auth user and
   * everything cascading from it — profile, attempts, entitlements. There is no undo.
   */
  deleteAccount(): Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(session: Session | null): AuthUser | null {
  const u = session?.user;
  if (!u) return null;
  const onboarded =
    Boolean(u.user_metadata?.onboarded_at) || Date.parse(u.created_at) < ONBOARDING_LAUNCHED_AT;
  return { id: u.id, email: u.email ?? '', onboarded };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialising, setInitialising] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(toUser(data.session));
        setInitialising(false);
      }
    });

    // Respects `cancelled` for the same reason `getSession` does: Supabase fires this callback
    // once on subscribe, and it can also land after unmount. It clears `initialising` too — if
    // it arrives before `getSession` resolves, the answer is already known and there is nothing
    // left to wait for.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(toUser(session));
      setInitialising(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initialising,
      async signUp(email, password, acceptedTerms) {
        if (!supabase) return { ok: false, message: 'Accounts are not configured.' };
        // Backstop for the form's own check: the policy must hold however signUp is reached.
        if (!isStrongPassword(password)) return { ok: false, message: WEAK_PASSWORD_MESSAGE };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              terms_version: acceptedTerms,
              terms_accepted_at: new Date().toISOString(),
              age_confirmed_18_plus: true,
            },
          },
        });
        if (error) return { ok: false, message: tidyError(error.message) };
        // A null session with a user back means confirmation mail is on its way.
        return { ok: true, needsConfirmation: !data.session && Boolean(data.user) };
      },
      async signIn(email, password) {
        if (!supabase) return { ok: false, message: 'Accounts are not configured.' };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, message: tidyError(error.message) };
        return { ok: true, needsConfirmation: false };
      },
      async markOnboarded() {
        if (!supabase) return;
        // The session's user updates via onAuthStateChange, which flips `onboarded` for us.
        await supabase.auth.updateUser({ data: { onboarded_at: new Date().toISOString() } });
      },
      async signOut() {
        await supabase?.auth.signOut();
        // Land on the login screen at a clean route rather than a stale module hash.
        if (typeof window !== 'undefined') window.location.hash = '';
      },
      async deleteAccount() {
        if (!supabase) return { ok: false, message: 'Accounts are not configured.' };
        const { error } = await supabase.rpc('delete_own_account');
        if (error) return { ok: false, message: tidyError(error.message) };
        // The server-side user is gone; drop the now-dead local session so the app
        // returns to its signed-out state rather than limping along on a stale JWT.
        await supabase.auth.signOut();
        return { ok: true, needsConfirmation: false };
      },
    }),
    [user, initialising],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Supabase's error strings are developer-speak ("Invalid login credentials"); learners deserve better. */
function tidyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'That email and password do not match an account.';
  if (lower.includes('already registered')) return 'An account already exists for that email.';
  // Covers "Password should be at least N characters" and the newer "Password should contain at
  // least one character of each: ..." wording Supabase returns for its composition rules.
  if (lower.includes('password should') || lower.includes('weak password')) return WEAK_PASSWORD_MESSAGE;
  if (lower.includes('email not confirmed')) return 'Confirm your email first, then check your inbox.';
  if (lower.includes('rate limit')) return 'Too many attempts just now. Wait a moment and retry.';
  if (lower.includes('permission denied') || lower.includes('not found'))
    return 'Deletion is not available on this deployment yet.';
  return message;
}

// eslint-disable-next-line react/only-export-components -- hooks live with their provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/**
 * Tolerant variant for plumbing that must work without a provider (tests, local-only builds).
 * Returns null rather than throwing when nobody mounted an AuthProvider.
 */
// eslint-disable-next-line react/only-export-components -- hooks live with their provider
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
