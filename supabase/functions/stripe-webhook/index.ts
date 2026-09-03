/**
 * The Stripe webhook — the only thing that may mint an institutional licence automatically.
 *
 * A medical school is invoiced from the Stripe dashboard for a block of seats and pays by bank
 * transfer, often weeks later. Until this existed, the second half of that sale was you noticing
 * the money had landed and running `mint_licence` by hand in the SQL editor; the gap between a paid
 * invoice and a class that can log in was entirely your memory. `invoice.paid` closes it.
 *
 * What an event MEANS lives in `../_shared/stripe.ts`, which a Vitest suite also imports — same
 * arrangement as the tutor and the RevenueCat webhook, and for the same reason. This file owns only
 * what the shared module cannot: signature verification, idempotency, the database client and the
 * one outbound call.
 *
 * Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
 * Secrets: supabase secrets set STRIPE_SECRET_KEY=rk_... STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * `--no-verify-jwt` is required and is not a hole: Stripe has no Supabase session to present, so
 * the request is authenticated by the signature instead — which is a considerably stronger claim
 * than the shared secret the RevenueCat webhook has to make do with.
 */

import { createClient } from 'npm:@supabase/supabase-js@^2.112.3';
import Stripe from 'npm:stripe@^22.4.0';
import { licenceOrder, type StripeEvent } from '../_shared/stripe.ts';

/**
 * Pinned rather than floating. An unpinned version means Stripe can change the shape of an invoice
 * under a function nobody is watching, and the failure would be a school paying and getting
 * nothing — the one failure here with a customer on the other end of it.
 */
const API_VERSION = '2026-07-29.dahlia';

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json(405, { message: 'Method not allowed.' });

  const apiKey = Deno.env.get('STRIPE_SECRET_KEY');
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!apiKey || !signingSecret || !supabaseUrl || !serviceRoleKey) {
    return json(500, { message: 'The invoice webhook is not configured on this deployment.' });
  }

  const signature = request.headers.get('Stripe-Signature');
  if (!signature) return json(400, { message: 'No signature.' });

  // The RAW body, before any JSON parsing. The signature is an HMAC over the exact bytes Stripe
  // sent, so `await request.json()` here — reasonable-looking, and what the sibling webhook does —
  // would re-serialise the payload and the signature could never match again.
  const raw = await request.text();

  const stripe = new Stripe(apiKey, {
    // The cast is load-bearing, not laziness. The SDK types `apiVersion` as the single string
    // literal it was generated against, so an explicit pin becomes a TYPE error the moment the
    // `^22.4.0` above picks up a minor release ahead of this constant — and the first thing that
    // would run that check is `supabase functions deploy`, i.e. the deploy breaks rather than the
    // build. The runtime accepts any released version, and the header is what decides the payload
    // shape, so an explicit pin is worth more here than the literal type is.
    apiVersion: API_VERSION as Stripe.StripeConfig['apiVersion'],
  });

  let event: StripeEvent;
  try {
    // `constructEventAsync`, not `constructEvent`. Deno's crypto is async, and the synchronous
    // form throws about a missing implementation rather than about the signature.
    event = (await stripe.webhooks.constructEventAsync(raw, signature, signingSecret)) as StripeEvent;
  } catch (error) {
    // Never echo the reason. A signature oracle is the one thing this endpoint must not be.
    console.error('[stripe] signature rejected:', String(error));
    return json(400, { message: 'Bad signature.' });
  }

  const eventId = event.id;
  if (!eventId) return json(400, { message: 'Event carried no id.' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Idempotency, on the same table the RevenueCat webhook uses. Checked BEFORE the mint and
  // recorded AFTER it: if the mint fails the event stays unrecorded and Stripe's retry does the
  // work, which is the failure mode worth having. `licences.stripe_invoice_id` is unique as well,
  // so a double-mint is impossible even if this check is somehow raced past.
  const { data: seen } = await supabase
    .from('billing_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (seen) return json(200, { status: 'duplicate', id: eventId });

  const outcome = licenceOrder(event);

  /** Record what happened, then answer. A retry cannot fix a typo, so these are all 200s. */
  const record = async (status: string, error: string | null): Promise<Response> => {
    const { error: recordError } = await supabase.from('billing_events').insert({
      id: eventId,
      event_type: event.type ?? 'UNKNOWN',
      payload: event,
      error,
    });

    // A duplicate here means a concurrent delivery beat us to it, having done the same work.
    if (recordError && recordError.code !== '23505') {
      return json(500, { message: `Could not record the event: ${recordError.message}` });
    }
    return json(200, { status, ...(error ? { error } : {}) });
  };

  if ('skip' in outcome) return await record('skipped', null);

  if ('error' in outcome) {
    // Loud, because somebody has paid and is waiting for a code that is not coming. The
    // billing_events row is what makes it findable after the log has rotated away.
    console.error(`[stripe] licence invoice could not be honoured: ${outcome.error}`);
    return await record('rejected', outcome.error);
  }

  const { order } = outcome;

  const { data, error: mintError } = await supabase.rpc('mint_licence_for_invoice', {
    p_stripe_invoice_id: order.invoiceId,
    p_institution_name: order.institutionName,
    p_seats: order.seats,
    p_expires_at: order.expiresAt,
    p_cohort_id: order.cohortId,
    p_notes: order.notes,
  });

  // A 500 makes Stripe retry for up to three days, which is exactly what a failed mint wants.
  if (mintError) {
    return json(500, { message: `Could not mint the licence: ${mintError.message}` });
  }

  // A composite return comes back as an object, a set-returning one as an array. Tolerate both,
  // the same way `src/billing/licence.ts` does with redeem_licence.
  const licence = (Array.isArray(data) ? data[0] : data) as { code?: string } | null;
  const code = licence?.code;
  if (!code) return json(500, { message: 'The licence was minted without a code.' });

  // Put the code back on the invoice, so it sits beside the thing that bought it in the dashboard
  // you are already looking at. Deliberately NOT fatal: the licence exists and the code is in
  // Postgres either way, and failing here would trade a working sale for a retry loop.
  try {
    await stripe.invoices.update(order.invoiceId, { metadata: { licence_code: code } });
  } catch (error) {
    console.error(`[stripe] minted ${code} but could not write it back to the invoice:`, String(error));
  }

  return await record('minted', null);
});
