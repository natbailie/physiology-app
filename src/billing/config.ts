/**
 * What the product costs and what is free. Every price and plan string in the UI comes from
 * here, so changing the offer is one edit rather than a search across pages.
 */

/**
 * Modules any signed-in learner can open without paying.
 *
 * Chosen to be a genuine taste of the product rather than a teaser: one cardiovascular, one
 * respiratory and one endocrine simulator, each with a full question set. The formula sheet is
 * free because a paywalled reference page reads as mean rather than as a reason to subscribe.
 */
export const FREE_MODULE_IDS: ReadonlySet<string> = new Set([
  'cardiorenal',
  'respiratory',
  'glucoseRegulation',
  'reference',
]);

/** Subscription states that unlock everything. Mirrors Stripe's own status vocabulary. */
export const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set(['active', 'trialing']);

/** TODO: set to the real price before launch — this is a placeholder, not a decision. */
export const PLAN = {
  name: 'Physiology Lab Full Access',
  price: '£9',
  period: 'month',
  features: [
    'Every simulator, not just the three free systems',
    'The full practice-question bank with worked explanations',
    'Spaced review — questions come back when you are about to forget them',
    'Progress that follows you across devices',
  ],
} as const;

/**
 * A code that unlocks full access without paying.
 *
 * TODO: remove before payments go live. This string is compiled into the JS bundle — anyone who
 * opens devtools and searches can find it and let themselves into the paid catalogue. That costs
 * nothing while `startCheckout` is a stub and nothing is actually being sold; it is a back door the
 * moment that changes. The real replacement is server-side redemption: an `access_codes` table plus
 * a `security definer` rpc that sets `profiles.subscription_status` for the calling user, which is
 * also what institutional or promo codes would need.
 *
 * Rotating this constant revokes every unlock already granted — `accessCode.ts` stores the redeemed
 * code and re-checks it against this value on every read.
 */
export const TEST_ACCESS_CODE = 'mbbs2627';
