import type { Package } from '@revenuecat/purchases-js';
import { purchasePackage } from './revenuecat';
import { confirmSubscription } from './useEntitlement';

/**
 * Begin — and finish — a subscription purchase.
 *
 * This used to be a stub shaped for Stripe Checkout: create a session, return a URL, send the
 * browser there. RevenueCat's Web SDK does not work that way. It renders the payment UI inside the
 * page and resolves once the purchase is complete, so there is no URL to redirect to and the
 * result gained a third case — the learner closing the sheet, which the SDK reports as an error
 * and which is not one.
 *
 * This file existing is what kept that change to one place.
 */

export type CheckoutResult =
  | { ok: true }
  | { cancelled: true }
  | { ok: false; message: string };

export async function startCheckout(
  userId: string,
  rcPackage: Package,
  customerEmail?: string,
): Promise<CheckoutResult> {
  const outcome = await purchasePackage(userId, rcPackage, customerEmail);

  if ('cancelled' in outcome) return outcome;
  if (!outcome.ok) return outcome;

  // Unlock now, reconcile with the webhook in the background. See confirmSubscription.
  void confirmSubscription(userId);

  return { ok: true };
}
