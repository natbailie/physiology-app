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
