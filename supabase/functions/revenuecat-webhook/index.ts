/**
 * The RevenueCat webhook — the only thing that may grant a paid subscription.
 *
 * The client can tell you it has just bought something, and it might even be telling the truth,
 * but `profiles.subscription_status` is written here and nowhere else: the column grants in
 * `supabase/schema.sql` deliberately deny every client any write to it, so this function runs with
 * the service role and is the whole of that path.
 *
 * What an event MEANS lives in `../_shared/revenuecat.ts`, which a Vitest suite also imports —
 * same arrangement as the tutor and `_shared/gemini.ts`, and for the same reason. This file owns
 * only what the shared module cannot: the secret check, idempotency, and the database client.
 *
 * Deploy:  supabase functions deploy revenuecat-webhook --no-verify-jwt
 * Secret:  supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
 *
 * `--no-verify-jwt` is required and is not a hole: RevenueCat has no Supabase session to present,
 * so the request is authenticated by the shared secret in the Authorization header instead. Set the
 * same value in RevenueCat's dashboard under the webhook's Authorization header field.
 */

import { createClient } from 'npm:@supabase/supabase-js@^2.112.3';
import { entitlementWrites, secretMatches, type RevenueCatEvent } from '../_shared/revenuecat.ts';

/**
 * RevenueCat App User IDs are configured to be Supabase user ids, but an event can still carry an
 * anonymous id (`$RCAnonymousID:…`) if the SDK was ever configured before sign-in. Those match no
 * profile, and passing one to a uuid column is an error rather than a miss.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json(405, { message: 'Method not allowed.' });

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return json(500, { message: 'The billing webhook is not configured on this deployment.' });
  }

  if (!secretMatches(request.headers.get('Authorization'), secret)) {
    return json(401, { message: 'Unauthorised.' });
  }

  let event: RevenueCatEvent;
  try {
    const body = await request.json();
    event = (body?.event ?? body) as RevenueCatEvent;
  } catch {
    return json(400, { message: 'Body was not JSON.' });
  }

  const eventId = event?.id;
  if (!eventId) return json(400, { message: 'Event carried no id.' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Idempotency. RevenueCat retries five times over two and a half hours and can duplicate a
  // delivery it already made, so an event id seen before must be a no-op rather than a second
  // grant. Checked BEFORE the writes and recorded AFTER them: if the writes fail, the event stays
  // unrecorded and the retry does the work, which is the failure mode worth having.
  const { data: seen } = await supabase
    .from('billing_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (seen) return json(200, { status: 'duplicate', id: eventId });

  const writes = entitlementWrites(event, Date.now());

  for (const write of writes) {
    if (!UUID.test(write.userId)) continue;

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: write.subscriptionStatus,
        current_period_end: write.currentPeriodEnd,
      })
      .eq('id', write.userId);

    // Anything other than 200 makes RevenueCat retry, which is exactly what a failed write wants.
    if (error) return json(500, { message: `Could not apply entitlement: ${error.message}` });
  }

  const { error: recordError } = await supabase.from('billing_events').insert({
    id: eventId,
    event_type: event.type ?? 'UNKNOWN',
    app_user_id: event.app_user_id ?? null,
    payload: event,
  });

  // A duplicate here means a concurrent delivery beat us to it, having applied the same absolute
  // state. Not an error, and not worth a retry.
  if (recordError && recordError.code !== '23505') {
    return json(500, { message: `Could not record the event: ${recordError.message}` });
  }

  return json(200, { status: 'ok', applied: writes.length });
});
