export type CheckoutResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Begin a subscription purchase.
 *
 * TODO: Stripe. The shape here is the one the real implementation will keep:
 *   1. Call a Supabase Edge Function (`create-checkout-session`) with the user's access token.
 *      The function creates or reuses a Stripe customer, opens a Checkout session for the
 *      subscription price, and returns its URL.
 *   2. Return `{ ok: true, url }`; the caller sends the browser there.
 *   3. A second Edge Function handles the `checkout.session.completed` and
 *      `customer.subscription.*` webhooks and writes `profiles.subscription_status` with the
 *      service-role key. The client never writes that column — see supabase/schema.sql.
 *
 * Until then this is the one place that has to change, which is the point of it existing.
 */
export async function startCheckout(): Promise<CheckoutResult> {
  return {
    ok: false,
    message: 'Payments are not live yet. Full access will open here shortly — thanks for your patience.',
  };
}
