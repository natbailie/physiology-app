/**
 * What a paid Stripe invoice means for an institutional licence.
 *
 * **Plain data only** — no `Deno.`, no Node APIs, no `Request`/`Response`, no crypto. Same rule,
 * and the same reason, as `_shared/revenuecat.ts` and `_shared/gemini.ts`: the edge function
 * imports this under Deno and `src/billing/stripeWebhook.test.ts` imports it under Vitest, so a
 * local green run is a claim about the deployed webhook rather than a test of a second
 * implementation. Signature verification, the database client and the outbound call stay in the
 * host, because those are the parts that genuinely cannot be shared.
 *
 * The shape of the deal this encodes: a medical school is invoiced for a block of seats, pays by
 * bank transfer weeks later, and the licence has to mint itself when the money lands. Everything
 * the licence needs that the invoice does not already carry — how many seats, how long for, which
 * cohort — is typed into the invoice's METADATA in the Stripe dashboard. That is what makes this
 * work with no admin UI: the dashboard is the admin UI, and this module is the part that reads
 * what was typed there and decides whether it is usable.
 */

/**
 * The metadata key that marks an invoice as one of ours.
 *
 * You will raise invoices for things that are not seat licences — consultancy, a conference stand,
 * a bespoke module. Those must be ignored in silence rather than failed, so an invoice earns a
 * licence by opting IN rather than by failing to opt out. Getting this backwards would mint a
 * licence for every invoice you ever send.
 */
export const METADATA_MARKER = 'physiology_licence';

/** Metadata values arrive as strings, so the marker is a string. These are the ones that mean no. */
const NEGATIVE = new Set(['', 'false', 'no', '0', 'off']);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A bare calendar date, as a human types an academic-year expiry. */
const BARE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The invoice fields acted on. Stripe adds fields constantly and versions its API around that, so
 * this is a subset and everything else is ignored — same tolerance as `RevenueCatEvent`.
 */
export interface StripeInvoice {
  id?: string;
  customer_name?: string | null;
  metadata?: Record<string, string> | null;
  amount_paid?: number | null;
  currency?: string | null;
  number?: string | null;
}

export interface StripeEvent {
  id?: string;
  type?: string;
  data?: { object?: StripeInvoice | null } | null;
}

/** Everything `mint_licence_for_invoice` needs, already validated. */
export interface LicenceOrder {
  invoiceId: string;
  institutionName: string;
  seats: number;
  /** ISO timestamp, or null for a perpetual licence. */
  expiresAt: string | null;
  cohortId: string | null;
  notes: string;
}

/**
 * Three outcomes, and the distinction between the last two is the whole point of this function.
 *
 * `skip` is an invoice that is none of our business. `error` is an invoice that IS our business
 * and cannot be honoured — which means a school has paid and is waiting for a code that is not
 * coming. The host answers both with a 200, because neither is fixed by Stripe retrying, but only
 * one of them is a problem. Collapsing them into a single "no" would bury the case that matters.
 */
export type OrderOutcome =
  | { order: LicenceOrder }
  | { skip: string }
  | { error: string };

/** Seats is a count typed by hand into a web form. `parseInt` alone accepts "350 seats". */
function parseSeats(raw: string | undefined): number | { error: string } {
  const value = (raw ?? '').trim();
  if (value === '') return { error: 'metadata carried no seats' };
  if (!/^\d+$/.test(value)) return { error: `seats was "${value}", which is not a whole number` };

  const seats = Number.parseInt(value, 10);
  // public.licences has `check (seats > 0)`, so a zero would be rejected by Postgres with a
  // constraint error that reads like a bug in this function rather than a typo in the dashboard.
  if (seats <= 0) return { error: 'seats must be greater than zero' };

  return seats;
}

/**
 * When the licence lapses.
 *
 * A bare `2027-07-31` is read as the END of that day rather than its beginning. A finance officer
 * typing an academic-year expiry means "works through the 31st", and `new Date('2027-07-31')` is
 * UTC midnight — which would cut a school off a day early, on the day, with no way to tell that
 * from an intentional expiry. A full timestamp is taken at its word.
 */
function parseExpiry(raw: string | undefined): string | null | { error: string } {
  const value = (raw ?? '').trim();
  if (value === '') return null;

  const parsed = new Date(BARE_DATE.test(value) ? `${value}T23:59:59.999Z` : value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: `expires_at was "${value}", which is not a date` };
  }
  return parsed.toISOString();
}

function parseCohort(raw: string | undefined): string | null | { error: string } {
  const value = (raw ?? '').trim();
  if (value === '') return null;
  if (!UUID.test(value)) return { error: `cohort_id was "${value}", which is not a uuid` };
  return value;
}

/** What ends up in `licences.notes`, so the row says which invoice bought it. */
function noteFor(invoice: StripeInvoice, metadata: Record<string, string>): string {
  const parts = [`Stripe invoice ${invoice.number ?? invoice.id}`];

  const amount = invoice.amount_paid;
  if (typeof amount === 'number' && invoice.currency) {
    // Stripe reports minor units: 45000 gbp is £450.00.
    parts.push(`${(amount / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`);
  }

  const extra = (metadata.notes ?? '').trim();
  if (extra !== '') parts.push(extra);

  return parts.join(' — ');
}

/**
 * Whether this event should mint a licence, and with what.
 *
 * Only `invoice.paid` is acted on. `invoice.finalized` means the school has been asked for money,
 * not that it has arrived, and granting on it would hand a class full access against an unpaid
 * invoice — which is the one failure here that costs real revenue rather than a support email.
 */
export function licenceOrder(event: StripeEvent): OrderOutcome {
  if (event.type !== 'invoice.paid') {
    return { skip: `${event.type ?? 'an untyped event'} is not a paid invoice` };
  }

  const invoice = event.data?.object;
  if (!invoice) return { skip: 'the event carried no invoice' };

  const metadata = invoice.metadata ?? {};
  const marker = (metadata[METADATA_MARKER] ?? '').trim().toLowerCase();
  if (NEGATIVE.has(marker)) return { skip: 'not a licence invoice' };

  // Past this point the invoice is ours, so every remaining failure is an error rather than a skip:
  // somebody has paid and is owed a code.
  if (!invoice.id) return { error: 'a licence invoice arrived with no id' };

  const institutionName = (metadata.institution_name ?? invoice.customer_name ?? '').trim();
  if (institutionName === '') {
    return { error: 'no institution_name in metadata and no customer name on the invoice' };
  }

  const seats = parseSeats(metadata.seats);
  if (typeof seats === 'object') return seats;

  const expiresAt = parseExpiry(metadata.expires_at);
  if (typeof expiresAt === 'object' && expiresAt !== null) return expiresAt;

  const cohortId = parseCohort(metadata.cohort_id);
  if (typeof cohortId === 'object' && cohortId !== null) return cohortId;

  return {
    order: {
      invoiceId: invoice.id,
      institutionName,
      seats,
      expiresAt,
      cohortId,
      notes: noteFor(invoice, metadata),
    },
  };
}
