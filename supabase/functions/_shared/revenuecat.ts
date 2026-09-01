/**
 * What a RevenueCat webhook event means for a learner's access.
 *
 * **Plain data only** — no `Deno.`, no Node APIs, no `Request`/`Response`. Same rule, and the same
 * reason, as `_shared/gemini.ts`: the edge function imports this under Deno and
 * `src/billing/revenuecat.webhook.test.ts` imports it under Vitest, so a local test is a real claim
 * about the deployed webhook rather than a test of a second implementation. HTTP, secrets and the
 * database client stay in the host.
 */

/** The entitlement configured in the RevenueCat dashboard. One product, one entitlement. */
export const ENTITLEMENT_ID = 'full_access';

/** Subscription states that unlock everything. Mirrors what `v_entitlement` checks in SQL. */
export const ACTIVE_STATUSES = ['active', 'trialing'] as const;

export type SubscriptionStatus = 'active' | 'trialing' | 'free';

/**
 * The fields of the event we act on. RevenueCat adds fields over time and explicitly asks
 * consumers to tolerate that, so this is a subset and everything else is ignored.
 */
export interface RevenueCatEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  /** Epoch ms. Null or absent for a non-expiring purchase. */
  expiration_at_ms?: number | null;
  entitlement_ids?: string[] | null;
  /** 'NORMAL' | 'TRIAL' | 'INTRO' | 'PROMOTIONAL' */
  period_type?: string;
  store?: string;
  /** TRANSFER only: the app user ids access moved away from, and to. */
  transferred_from?: string[];
  transferred_to?: string[];
}

export interface EntitlementWrite {
  /** The RevenueCat App User ID, which this app configures to BE the Supabase user id. */
  userId: string;
  subscriptionStatus: SubscriptionStatus;
  /** ISO timestamp, or null for a purchase that does not expire. */
  currentPeriodEnd: string | null;
}

/** Events that carry no entitlement consequence at all. */
const IGNORED_TYPES = new Set(['TEST', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'INVOICE_ISSUANCE']);

/**
 * Whether this event concerns the entitlement we sell.
 *
 * Some event types omit `entitlement_ids` entirely; those are acted on rather than dropped, because
 * a missed EXPIRATION leaves a lapsed subscriber with full access and a missed RENEWAL locks out
 * someone who has paid. Only an event that names entitlements and does not name ours is skipped.
 */
function concernsUs(event: RevenueCatEvent): boolean {
  const ids = event.entitlement_ids;
  if (!ids || ids.length === 0) return true;
  return ids.includes(ENTITLEMENT_ID);
}

/**
 * Status from the expiry, never from the event type.
 *
 * This is the part that is easy to get wrong. `CANCELLATION` does NOT mean access ends — it means
 * auto-renew was switched off, and the learner keeps what they paid for until `EXPIRATION`.
 * `BILLING_ISSUE` is the same: a grace period with the expiry still ahead. Deriving the answer from
 * `expiration_at_ms` rather than from the type gets both right without a special case, and it also
 * survives out-of-order delivery — a RENEWAL arriving after the EXPIRATION it supersedes still
 * lands on the correct answer, because the later expiry wins on its own merits.
 */
function statusFrom(event: RevenueCatEvent, nowMs: number): SubscriptionStatus {
  if (event.type === 'EXPIRATION') return 'free';

  const expiry = event.expiration_at_ms;
  // A purchase with no expiry does not lapse.
  if (expiry === null || expiry === undefined) return 'active';
  if (expiry <= nowMs) return 'free';

  return event.period_type === 'TRIAL' ? 'trialing' : 'active';
}

function periodEnd(event: RevenueCatEvent): string | null {
  const expiry = event.expiration_at_ms;
  if (expiry === null || expiry === undefined) return null;
  return new Date(expiry).toISOString();
}

/**
 * What to write, for whom. Usually one row; a TRANSFER moves access between two accounts and so
 * produces two.
 *
 * An empty array means "record the event and do nothing else", which is a legitimate outcome and
 * not a failure — the host must still return 200 or RevenueCat will retry for two and a half hours.
 */
export function entitlementWrites(event: RevenueCatEvent, nowMs: number): EntitlementWrite[] {
  if (event.type && IGNORED_TYPES.has(event.type)) return [];
  if (!concernsUs(event)) return [];

  if (event.type === 'TRANSFER') {
    const writes: EntitlementWrite[] = [];
    for (const userId of event.transferred_from ?? []) {
      writes.push({ userId, subscriptionStatus: 'free', currentPeriodEnd: null });
    }
    for (const userId of event.transferred_to ?? []) {
      writes.push({ userId, subscriptionStatus: statusFrom(event, nowMs), currentPeriodEnd: periodEnd(event) });
    }
    return writes;
  }

  const userId = event.app_user_id ?? event.original_app_user_id;
  if (!userId) return [];

  return [{ userId, subscriptionStatus: statusFrom(event, nowMs), currentPeriodEnd: periodEnd(event) }];
}

/**
 * Constant-time string comparison for the shared secret.
 *
 * `===` on secrets leaks their length and their common prefix through timing. The cost of doing it
 * properly here is four lines.
 */
export function secretMatches(presented: string | null | undefined, expected: string): boolean {
  if (!presented || expected === '') return false;
  if (presented.length !== expected.length) return false;

  let difference = 0;
  for (let i = 0; i < presented.length; i += 1) {
    difference |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}
