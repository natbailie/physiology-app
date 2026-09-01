import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthOptional } from '@/auth/AuthContext';
import { FREE_MODULE_IDS } from './config';

export type EntitlementStatus = 'loading' | 'free' | 'active';

/** Where full access came from. `none` covers both an unsubscribed learner and a build with no
 * Supabase to sell a subscription through. */
export type EntitlementSource = 'institution' | 'subscription' | 'none';

export interface Entitlement {
  status: EntitlementStatus;
  source: EntitlementSource;
  /** Named on the licence, when a school is paying. Null otherwise. */
  institutionName: string | null;
  /** Whether this learner may open a given module right now. */
  isUnlocked(moduleId: string): boolean;
}

interface Resolved {
  status: Exclude<EntitlementStatus, 'loading'>;
  source: EntitlementSource;
  institutionName: string | null;
}

const LOCKED: Resolved = { status: 'free', source: 'none', institutionName: null };
const OPEN: Resolved = { status: 'active', source: 'none', institutionName: null };

/** One lookup per user for the app's lifetime; every page shares the answer. */
const cache = new Map<string, Resolved>();
const inFlight = new Map<string, Promise<Resolved>>();

/**
 * Bumped whenever the answer might have changed — a licence redeemed, a purchase completed.
 *
 * Redeeming on the pricing page has to re-render the home grid and the route gate too, and there
 * is no storage event to lean on now that the answer lives on the server. This is the same
 * external-store idiom `useProgressStore` uses, keyed on a revision rather than a boolean so it
 * serves any reason the entitlement might need re-reading.
 */
let revision = 0;
const listeners = new Set<() => void>();

function subscribeRevision(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getRevision = () => revision;
/** Server snapshot for `useSyncExternalStore`: nothing has been invalidated before hydration. */
const getRevisionServerSnapshot = () => 0;

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

function bump() {
  revision += 1;
  for (const listener of listeners) listener();
}

/** Forget what we knew and tell every consumer to ask again. */
export function invalidateEntitlement(userId?: string) {
  clearEntitlementCache(userId);
  bump();
}

async function fetchEntitlement(userId: string): Promise<Resolved> {
  if (!supabase) return LOCKED;

  // v_entitlement resolves an institutional seat against a personal subscription in SQL, so the
  // precedence rule is somewhere a client cannot route around. See supabase/schema-billing.sql.
  const { data, error } = await supabase
    .from('v_entitlement')
    .select('status, source, institution_name')
    .eq('user_id', userId)
    .maybeSingle();

  // A network blip must never hand out free access to the paid catalogue.
  if (error || !data) return LOCKED;

  return {
    status: data.status === 'active' ? 'active' : 'free',
    source: (data.source as EntitlementSource) ?? 'none',
    institutionName: (data.institution_name as string | null) ?? null,
  };
}

function entitlementFor(userId: string): Promise<Resolved> {
  const running = inFlight.get(userId);
  if (running) return running;

  const promise = fetchEntitlement(userId).then((resolved) => {
    cache.set(userId, resolved);
    inFlight.delete(userId);
    return resolved;
  });
  inFlight.set(userId, promise);
  return promise;
}

/**
 * What the current learner has paid for — or what their school has paid for on their behalf.
 *
 * With no Supabase configured there is no subscription to check and no way to buy one, so the
 * build is treated as fully unlocked — the app has always been required to run without accounts.
 */
export function useEntitlement(): Entitlement {
  const { user } = useAuthOptional() ?? { user: null };
  const userId = user?.id ?? null;

  const revisionNow = useSyncExternalStore(subscribeRevision, getRevision, getRevisionServerSnapshot);

  const [resolved, setResolved] = useState<Resolved | 'loading'>(() => {
    if (!isSupabaseConfigured) return OPEN;
    if (userId === null) return LOCKED;
    return cache.get(userId) ?? 'loading';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setResolved(OPEN);
      return;
    }
    if (userId === null) {
      // Signing out must not leave the next learner on this browser holding the last one's answer.
      clearEntitlementCache();
      setResolved(LOCKED);
      return;
    }

    const cached = cache.get(userId);
    if (cached) {
      setResolved(cached);
      return;
    }

    let cancelled = false;
    setResolved('loading');
    void entitlementFor(userId).then((next) => {
      if (!cancelled) setResolved(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, revisionNow]);

  return useMemo(() => {
    const status: EntitlementStatus = resolved === 'loading' ? 'loading' : resolved.status;
    const source: EntitlementSource = resolved === 'loading' ? 'none' : resolved.source;
    const institutionName = resolved === 'loading' ? null : resolved.institutionName;

    return {
      status,
      source,
      institutionName,
      isUnlocked: (moduleId: string) => status === 'active' || FREE_MODULE_IDS.has(moduleId),
    };
  }, [resolved]);
}

/**
 * Backoff between asking the server whether the webhook has landed. Roughly sixteen seconds in
 * total, which is generous against RevenueCat's usual five-to-sixty.
 */
const CONFIRM_DELAYS_MS = [500, 1000, 2000, 4000, 8000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Called after a completed purchase, and the reason a learner is not left staring at a paywall
 * they have just paid to remove.
 *
 * `purchase()` resolves as soon as RevenueCat has the money; the webhook that writes
 * `profiles.subscription_status` arrives seconds later, sometimes a minute. So the grant is made
 * optimistically first and the server is polled afterwards to replace it with the real answer.
 *
 * If the poll never agrees the optimistic grant STAYS for this session. The learner has paid, the
 * webhook will land, and the next page load will read the truth — withholding access from someone
 * who has just been charged is the worse of the two failure modes by a distance.
 *
 * Returns whether the server caught up before we stopped asking.
 */
export async function confirmSubscription(userId: string): Promise<boolean> {
  cache.set(userId, { status: 'active', source: 'subscription', institutionName: null });
  inFlight.delete(userId);
  bump();

  for (const delay of CONFIRM_DELAYS_MS) {
    await sleep(delay);
    const resolved = await fetchEntitlement(userId);
    if (resolved.status === 'active') {
      cache.set(userId, resolved);
      bump();
      return true;
    }
  }

  return false;
}
