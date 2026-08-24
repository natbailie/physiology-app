import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthOptional } from '@/auth/AuthContext';
import { ACTIVE_SUBSCRIPTION_STATUSES, FREE_MODULE_IDS } from './config';
import {
  getAccessCodeServerSnapshot,
  getAccessCodeSnapshot,
  subscribeAccessCode,
} from './accessCode';

export type EntitlementStatus = 'loading' | 'free' | 'active';

export interface Entitlement {
  status: EntitlementStatus;
  /** True when full access comes from a redeemed access code rather than a subscription. */
  viaAccessCode: boolean;
  /** Whether this learner may open a given module right now. */
  isUnlocked(moduleId: string): boolean;
}

/** One lookup per user for the app's lifetime; every page shares the answer. */
const cache = new Map<string, EntitlementStatus>();
const inFlight = new Map<string, Promise<EntitlementStatus>>();

/** Drops the memoised answer — call after sign-out, and between tests. */
export function clearEntitlementCache(userId?: string) {
  if (userId === undefined) {
    cache.clear();
    inFlight.clear();
  } else {
    cache.delete(userId);
    inFlight.delete(userId);
  }
}

async function fetchStatus(userId: string): Promise<EntitlementStatus> {
  if (!supabase) return 'free';
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .maybeSingle();

  // A network blip must never hand out free access to the paid catalogue.
  if (error || !data) return 'free';
  return ACTIVE_SUBSCRIPTION_STATUSES.has(String(data.subscription_status)) ? 'active' : 'free';
}

function statusFor(userId: string): Promise<EntitlementStatus> {
  const running = inFlight.get(userId);
  if (running) return running;

  const promise = fetchStatus(userId).then((status) => {
    cache.set(userId, status);
    inFlight.delete(userId);
    return status;
  });
  inFlight.set(userId, promise);
  return promise;
}

/**
 * What the current learner has paid for.
 *
 * With no Supabase configured there is no subscription to check and no way to buy one, so the
 * build is treated as fully unlocked — the app has always been required to run without accounts.
 *
 * A redeemed access code overrides whatever the server says, which is the whole point of it.
 */
export function useEntitlement(): Entitlement {
  const { user } = useAuthOptional() ?? { user: null };
  const userId = user?.id ?? null;

  // Same idiom as useProgressStore: an external flag every consumer re-renders on, so redeeming
  // on the pricing page unlocks the home grid and the route gate without a reload.
  const viaAccessCode = useSyncExternalStore(
    subscribeAccessCode,
    getAccessCodeSnapshot,
    getAccessCodeServerSnapshot,
  );

  const [status, setStatus] = useState<EntitlementStatus>(() => {
    if (!isSupabaseConfigured) return 'active';
    if (userId === null) return 'free';
    return cache.get(userId) ?? 'loading';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('active');
      return;
    }
    if (userId === null) {
      // Signing out must not leave the next learner on this browser holding the last one's answer.
      clearEntitlementCache();
      setStatus('free');
      return;
    }

    const cached = cache.get(userId);
    if (cached) {
      setStatus(cached);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    void statusFor(userId).then((resolved) => {
      if (!cancelled) setStatus(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const effective: EntitlementStatus = viaAccessCode ? 'active' : status;

  return useMemo(
    () => ({
      status: effective,
      viaAccessCode,
      isUnlocked: (moduleId: string) => effective === 'active' || FREE_MODULE_IDS.has(moduleId),
    }),
    [effective, viaAccessCode],
  );
}
