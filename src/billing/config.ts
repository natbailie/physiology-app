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
  /**
   * The saving on the better-value package, COMPUTED from the two prices by `savingNote`.
   *
   * It used to be a hand-typed "Two months free" against £9/£55 (the prices at the time) — which is nearer six months
   * free, and a price claim that does not match the prices is a misleading action under the DMCC
   * Act 2024 whichever direction it errs in. Computing it means a dashboard price change cannot
   * leave the claim behind.
   */
  note?: string;
}

/** A formatted price split into currency prefix and amount: "£9.00" → ["£", 9]. */
function parsePrice(price: string): [string, number] | null {
  const match = /^([^\d\s.,-]*)\s*(\d+(?:[.,]\d{1,2})?)/.exec(price.trim());
  if (!match) return null;
  const amount = Number((match[2] ?? '').replace(',', '.'));
  return Number.isFinite(amount) ? [match[1] ?? '', amount] : null;
}

/**
 * "Save £20.88 a year compared with paying each month", from the two prices as displayed — or nothing, if
 * they cannot be compared honestly (different currencies, unparseable, or no saving at all).
 */
export function savingNote(monthlyPrice: string, annualPrice: string): string | undefined {
  const monthly = parsePrice(monthlyPrice);
  const annual = parsePrice(annualPrice);
  if (!monthly || !annual || monthly[0] !== annual[0]) return undefined;
  const saving = monthly[1] * 12 - annual[1];
  if (saving < 1) return undefined;
  const amount = Number.isInteger(saving) ? String(saving) : saving.toFixed(2);
  return `Save ${monthly[0]}${amount} a year compared with paying each month`;
}

/**
 * Two packages, because students buy revision resources in both shapes: a month to get through a
 * block, and a year bought once before finals. Annual is the one that matters commercially and is
 * discounted enough to say so.
 */
export const FALLBACK_PACKAGES: readonly PlanPackage[] = [
  { id: '$rc_monthly', label: 'Monthly', price: '£9.99', period: 'month' },
  { id: '$rc_annual', label: 'Annual', price: '£99', period: 'year', note: savingNote('£9.99', '£99') },
];

/**
 * Pre-contract information shown beside every Subscribe button (Consumer Contracts Regulations
 * 2013 Sch. 2; App Store Review Guideline 3.1.2). One wording, so the web and the phone agree.
 */
export const AUTO_RENEW_DISCLOSURE =
  'Your subscription renews automatically at the end of each billing period at the price shown, until you cancel. Cancel any time and keep access to the end of the period you have paid for. Prices include VAT where applicable.';

export const PLAN_FEATURES: readonly string[] = [
  'Every simulator, not just the three free systems',
  'The full practice-question bank with worked explanations',
  'Spaced review — questions come back when you are about to forget them',
  'Progress that follows you across devices',
];
