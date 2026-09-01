/**
 * What the product costs and what is free.
 *
 * Prices now live in the RevenueCat dashboard and reach the pricing page through the offering, so
 * changing the offer is a dashboard edit rather than a deploy. What is here is the FALLBACK — what
 * a learner sees when RevenueCat is unconfigured, unreachable, or still loading. The pricing page
 * has to render something truthful in all three cases, the same way the tutor and the auth gate
 * stand aside rather than breaking when their backend is absent.
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
  'medications',
]);

export const PLAN_NAME = 'Physiology Lab Full Access';

export interface PlanPackage {
  /** Matches RevenueCat's own package identifiers, which is how an offering is mapped onto this. */
  id: '$rc_monthly' | '$rc_annual';
  label: string;
  price: string;
  period: string;
  /** Set on whichever package is the better deal, so the saving is stated rather than computed. */
  note?: string;
}

/**
 * Two packages, because students buy revision resources in both shapes: a month to get through a
 * block, and a year bought once before finals. Annual is the one that matters commercially and is
 * discounted enough to say so.
 */
export const FALLBACK_PACKAGES: readonly PlanPackage[] = [
  { id: '$rc_monthly', label: 'Monthly', price: '£9', period: 'month' },
  { id: '$rc_annual', label: 'Annual', price: '£55', period: 'year', note: 'Two months free' },
];

export const PLAN_FEATURES: readonly string[] = [
  'Every simulator, not just the three free systems',
  'The full practice-question bank with worked explanations',
  'Spaced review — questions come back when you are about to forget them',
  'Progress that follows you across devices',
];
