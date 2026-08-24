import type { ReactNode } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LandingPage } from '@/landing/LandingPage';
import type { RouteId } from '@/shared/hooks/useHashRoute';
import { useAuth } from './AuthContext';
import styles from './AuthGate.module.css';

/** Routes a signed-out visitor may still see. Pricing is the one thing worth reading before
 * joining; the privacy notice must be readable without an account or it protects no one. */
const PUBLIC_ROUTES: ReadonlySet<RouteId> = new Set<RouteId>(['pricing', 'privacy']);

/**
 * Nothing but the landing screen renders until there is a session.
 *
 * The hash is deliberately left alone, so a link straight to `#shockStates` survives the detour:
 * signing in flips `user`, this re-renders, and the router is already sitting on the right route.
 *
 * A build with no Supabase credentials has no accounts to gate with — and the app has always been
 * required to run that way — so the gate stands aside entirely.
 */
export function AuthGate({ route, children }: { route: RouteId; children: ReactNode }) {
  const { user, initialising } = useAuth();

  if (!isSupabaseConfigured) return <>{children}</>;

  // AuthContext flags that pages must not flash "signed out"; this is the only place it matters now.
  if (initialising) {
    return <div className={styles.splash}>Checking your session…</div>;
  }

  if (!user && !PUBLIC_ROUTES.has(route)) return <LandingPage />;

  return <>{children}</>;
}
