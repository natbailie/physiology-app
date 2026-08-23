import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthResult = { ok: true; needsConfirmation: boolean } | { ok: false; message: string };

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the first session lookup resolves — pages must not flash "signed out". */
  initialising: boolean;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(session: Session | null): AuthUser | null {
  const u = session?.user;
  return u ? { id: u.id, email: u.email ?? '' } : null;
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session));
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
      async signUp(email, password) {
        if (!supabase) return { ok: false, message: 'Accounts are not configured.' };
        const { data, error } = await supabase.auth.signUp({ email, password });
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
      async signOut() {
        await supabase?.auth.signOut();
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
  if (lower.includes('password should be')) return 'Passwords need at least six characters.';
  if (lower.includes('email not confirmed')) return 'Confirm your email first — check your inbox.';
  if (lower.includes('rate limit')) return 'Too many attempts just now — wait a moment and retry.';
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
