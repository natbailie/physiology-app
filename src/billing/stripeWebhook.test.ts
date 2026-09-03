import { describe, expect, it } from 'vitest';
import {
  licenceOrder,
  METADATA_MARKER,
  type StripeEvent,
  type StripeInvoice,
} from '../../supabase/functions/_shared/stripe.ts';

/**
 * The invoice webhook's judgement, tested where it can be tested.
 *
 * Same arrangement as `revenuecatWebhook.test.ts`: the edge function imports this module under Deno
 * and so does this suite under Vitest, which is what makes a local green run a claim about the
 * deployed webhook rather than a test of a second implementation. Signature verification is not
 * here because it is not there — it needs async crypto and lives in the host.
 *
 * The failure these mostly exist for is quiet rather than loud. A school pays a five-figure invoice
 * by bank transfer, the metadata says `seats: "three hundred"`, and the difference between an
 * invoice that is NOT ours and one that is ours and unusable is the difference between correct
 * silence and four hundred students who cannot log in on the Monday of a new term.
 */

/** Metadata is a flat string map in Stripe, so every value here is a string on purpose. */
function meta(partial: Record<string, string | undefined> = {}): Record<string, string> {
  const base: Record<string, string> = {
    [METADATA_MARKER]: 'true',
    seats: '350',
    expires_at: '2027-07-31',
  };

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) delete base[key];
    else base[key] = value;
  }
  return base;
}

function event(invoice: Partial<StripeInvoice> = {}, type = 'invoice.paid'): StripeEvent {
  return {
    id: 'evt_1',
    type,
    data: {
      object: {
        id: 'in_1',
        number: 'INV-0042',
        customer_name: 'Barts and The London',
        amount_paid: 45_000,
        currency: 'gbp',
        metadata: meta(),
        ...invoice,
      },
    },
  };
}

describe('a paid licence invoice', () => {
  it('reads the whole order off the invoice and its metadata', () => {
    expect(licenceOrder(event())).toEqual({
      order: {
        invoiceId: 'in_1',
        institutionName: 'Barts and The London',
        seats: 350,
        expiresAt: '2027-07-31T23:59:59.999Z',
        cohortId: null,
        notes: 'Stripe invoice INV-0042 — 450.00 GBP',
      },
    });
  });

  it('prefers an explicit institution_name over the customer on the invoice', () => {
    const outcome = licenceOrder(event({ metadata: meta({ institution_name: 'Barts — School of Medicine' }) }));
    expect(outcome).toMatchObject({ order: { institutionName: 'Barts — School of Medicine' } });
  });

  it('carries a cohort through, so one code both pays for a year group and enrols it', () => {
    const cohort = '11111111-2222-3333-4444-555555555555';
    expect(licenceOrder(event({ metadata: meta({ cohort_id: cohort }) }))).toMatchObject({
      order: { cohortId: cohort },
    });
  });

  it('treats an absent expiry as a perpetual licence rather than an error', () => {
    expect(licenceOrder(event({ metadata: meta({ expires_at: undefined }) }))).toMatchObject({
      order: { expiresAt: null },
    });
  });

  it('reads a bare expiry date as the END of that day', () => {
    // A licence reading 2027-07-31 has to work THROUGH the 31st. UTC midnight would cut a school
    // off a day early, on the day, and look exactly like an intentional expiry while doing it.
    expect(licenceOrder(event({ metadata: meta({ expires_at: '2027-07-31' }) }))).toMatchObject({
      order: { expiresAt: '2027-07-31T23:59:59.999Z' },
    });
  });

  it('takes a full timestamp at its word', () => {
    expect(licenceOrder(event({ metadata: meta({ expires_at: '2027-09-01T09:00:00Z' }) }))).toMatchObject({
      order: { expiresAt: '2027-09-01T09:00:00.000Z' },
    });
  });

  it('falls back to the invoice id when the invoice has no number yet', () => {
    expect(licenceOrder(event({ number: null }))).toMatchObject({
      order: { notes: 'Stripe invoice in_1 — 450.00 GBP' },
    });
  });

  it('appends free-text notes to the provenance rather than replacing it', () => {
    expect(licenceOrder(event({ metadata: meta({ notes: 'PO 44821' }) }))).toMatchObject({
      order: { notes: 'Stripe invoice INV-0042 — 450.00 GBP — PO 44821' },
    });
  });
});

describe('an invoice that is none of our business', () => {
  it('skips an invoice with no marker, because most invoices are not licences', () => {
    const outcome = licenceOrder(event({ metadata: { seats: '350' } }));
    expect(outcome).toEqual({ skip: 'not a licence invoice' });
  });

  it('skips an invoice with no metadata at all', () => {
    expect(licenceOrder(event({ metadata: null }))).toEqual({ skip: 'not a licence invoice' });
  });

  it.each(['false', 'no', '0', 'off', ''])('skips a marker of "%s"', (marker) => {
    expect(licenceOrder(event({ metadata: meta({ [METADATA_MARKER]: marker }) }))).toEqual({
      skip: 'not a licence invoice',
    });
  });

  it('skips a finalised invoice, which is a request for money rather than money', () => {
    // The one failure here that costs real revenue: granting a class full access against an
    // invoice that has been sent and not paid.
    expect(licenceOrder(event({}, 'invoice.finalized'))).toMatchObject({ skip: expect.any(String) });
  });

  it.each(['invoice.payment_failed', 'invoice.voided', 'customer.subscription.created'])(
    'skips %s',
    (type) => {
      expect(licenceOrder(event({}, type))).toMatchObject({ skip: expect.any(String) });
    },
  );

  it('skips an event carrying no invoice', () => {
    expect(licenceOrder({ id: 'evt_1', type: 'invoice.paid', data: null })).toMatchObject({
      skip: expect.any(String),
    });
  });
});

describe('an invoice that is ours and cannot be honoured', () => {
  // Every case below must be an `error`, never a `skip`. Somebody has paid; the difference is
  // whether anyone ever finds out that they got nothing for it.

  it.each([
    ['absent', undefined],
    ['not a number', 'three hundred'],
    ['zero', '0'],
    ['trailing text', '350 seats'],
    ['a decimal', '350.5'],
    ['negative', '-350'],
  ])('rejects a seat count that is %s', (_name, seats) => {
    expect(licenceOrder(event({ metadata: meta({ seats }) }))).toMatchObject({
      error: expect.any(String),
    });
  });

  it('rejects an expiry that is not a date', () => {
    expect(licenceOrder(event({ metadata: meta({ expires_at: 'end of the academic year' }) })))
      .toMatchObject({ error: expect.any(String) });
  });

  it('rejects a cohort id that is not a uuid', () => {
    // Passing this to a uuid column is an error rather than a miss, so it is caught here where the
    // reason can be written down instead of in Postgres where it cannot.
    expect(licenceOrder(event({ metadata: meta({ cohort_id: 'year-2' }) }))).toMatchObject({
      error: expect.any(String),
    });
  });

  it('rejects an invoice with no name to put on the licence', () => {
    expect(licenceOrder(event({ customer_name: null, metadata: meta({ institution_name: '   ' }) })))
      .toMatchObject({ error: expect.any(String) });
  });

  it('says what was wrong, because the message is what lands in billing_events.error', () => {
    const outcome = licenceOrder(event({ metadata: meta({ seats: 'three hundred' }) }));
    expect(outcome).toHaveProperty('error');
    expect((outcome as { error: string }).error).toContain('three hundred');
  });
});
