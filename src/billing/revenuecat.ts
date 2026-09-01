import type { Package, Purchases, PurchasesError } from '@revenuecat/purchases-js';
import { FALLBACK_PACKAGES, type PlanPackage } from './config';

/**
 * The RevenueCat Web Billing SDK, loaded only when somebody is actually going to buy something.
 *
 * `CLAUDE.md` says nothing the learner sees may add a runtime dependency, with the Supabase client
 * as the single infrastructure exception. This is the second one, and it gets the same treatment:
 * **every import of `@revenuecat/purchases-js` in this file is dynamic**, so the SDK and its
 * stylesheet land in their own chunk that a learner who never opens the pricing page never
 * downloads. Nothing here may be imported at module scope by a page.
 *
 * The App User ID is the Supabase user id, deliberately. That is what lets the webhook join
 * `app_user_id` straight onto `profiles.id` with no mapping table, and what makes a subscription
 * follow the account rather than the browser.
 */

const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

/** False until the key is set — the pricing page then shows the fallback prices and says so. */
export const isRevenueCatConfigured = Boolean(apiKey);

/** The user the SDK was configured for, so a second sign-in switches rather than re-configures. */
let configuredFor: string | null = null;

async function sdk(appUserId: string): Promise<Purchases> {
  // No stylesheet import. The package's exports map still advertises `@revenuecat/purchases-js/
  // styles`, and older docs tell you to import it, but `dist/style.css` does not ship in 1.55 —
  // the build fails to resolve it, and the SDK injects its own styles at runtime anyway.
  const { Purchases: PurchasesClass } = await import('@revenuecat/purchases-js');

  if (configuredFor === appUserId && PurchasesClass.isConfigured()) {
    return PurchasesClass.getSharedInstance();
  }

  if (PurchasesClass.isConfigured()) {
    // Configuring twice throws; a learner who signs out and back in as someone else needs the
    // purchases to follow the new account.
    const instance = PurchasesClass.getSharedInstance();
    await instance.changeUser(appUserId);
    configuredFor = appUserId;
    return instance;
  }

  const instance = PurchasesClass.configure({ apiKey: apiKey as string, appUserId });
  configuredFor = appUserId;
  return instance;
}

/** A package as the pricing page needs it, alongside the RevenueCat object to buy it with. */
export interface OfferedPackage extends PlanPackage {
  rcPackage: Package;
}

/**
 * The current offering, mapped onto the shape the pricing page renders.
 *
 * Returns null rather than throwing when RevenueCat is unconfigured or unreachable — the caller
 * falls back to `FALLBACK_PACKAGES`, because a pricing page that renders nothing is worse than one
 * showing last known prices.
 */
export async function fetchOfferedPackages(appUserId: string): Promise<OfferedPackage[] | null> {
  if (!isRevenueCatConfigured) return null;

  try {
    const offerings = await (await sdk(appUserId)).getOfferings();
    const current = offerings.current;
    if (!current) return null;

    const mapped = current.availablePackages
      .map((rcPackage) => {
        const fallback = FALLBACK_PACKAGES.find((plan) => plan.id === rcPackage.identifier);
        if (!fallback) return null;

        const product = rcPackage.webBillingProduct;
        return {
          ...fallback,
          // The dashboard is the source of truth for price and currency, and it localises.
          price: product.price?.formattedPrice ?? fallback.price,
          rcPackage,
        } satisfies OfferedPackage;
      })
      .filter((entry): entry is OfferedPackage => entry !== null);

    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  }
}

export type PurchaseOutcome =
  | { ok: true }
  | { cancelled: true }
  | { ok: false; message: string };

/** RevenueCat reports a closed purchase sheet as an error; it is not one. */
const USER_CANCELLED = 1;

export async function purchasePackage(
  appUserId: string,
  rcPackage: Package,
  customerEmail?: string,
): Promise<PurchaseOutcome> {
  try {
    await (await sdk(appUserId)).purchase({ rcPackage, customerEmail });
    return { ok: true };
  } catch (error) {
    if ((error as PurchasesError)?.errorCode === USER_CANCELLED) return { cancelled: true };
    return {
      ok: false,
      message:
        (error as Error)?.message ??
        'The payment could not be completed. Nothing has been charged — try again in a moment.',
    };
  }
}
