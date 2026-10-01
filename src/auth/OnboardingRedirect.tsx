import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

/**
 * First sign-in only: sends a new account to the plans / licence-code page, then records that it
 * has done so. Email confirmation is on, so this cannot run at sign-up time — there is no session
 * until the learner has confirmed and signed in. Renders nothing.
 */
export function OnboardingRedirect() {
  const { user, markOnboarded } = useAuth();
  const fired = useRef(false);
  const needs = user !== null && !user.onboarded;

  useEffect(() => {
    if (!needs || fired.current) return;
    fired.current = true;
    window.location.hash = '#pricing';
    void markOnboarded();
  }, [needs, markOnboarded]);

  return null;
}
