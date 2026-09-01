import { describe, expect, it } from 'vitest';
import {
  ENTITLEMENT_ID,
  entitlementWrites,
  secretMatches,
  type RevenueCatEvent,
} from '../../supabase/functions/_shared/revenuecat.ts';

/**
 * The webhook's judgement, tested where it can be tested.
 *
 * Same arrangement as `geminiFrames.test.ts`: the edge function imports this module under Deno and
 * so does this suite under Vitest, which is what makes a local green run a claim about the deployed
 * webhook rather than a test of a second implementation.
 *
 * The bug these mostly exist for: `CANCELLATION` does not mean access ends. It means auto-renew was
 * switched off. A learner who cancels on day two of a year they have paid for keeps every module
 * until the year is up, and treating the event as a revocation would lock out a paying customer
 * with no error anywhere to find it by.
 */

const NOW = Date.UTC(2026, 7, 31);
const DAY = 86_400_000;

function event(partial: Partial<RevenueCatEvent>): RevenueCatEvent {
  return {
    id: 'evt_1',
    type: 'INITIAL_PURCHASE',
    app_user_id: '11111111-2222-3333-4444-555555555555',
    entitlement_ids: [ENTITLEMENT_ID],
    period_type: 'NORMAL',
    expiration_at_ms: NOW + 30 * DAY,
    ...partial,
  };
}

describe('what an event means', () => {
  it('grants access on an initial purchase', () => {
    expect(entitlementWrites(event({}), NOW)).toEqual([
      {
        userId: '11111111-2222-3333-4444-555555555555',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(NOW + 30 * DAY).toISOString(),
      },
    ]);
  });

  it('keeps access through a CANCELLATION — auto-renew is off, the period is not over', () => {
    const [write] = entitlementWrites(event({ type: 'CANCELLATION' }), NOW);
    expect(write?.subscriptionStatus).toBe('active');
    expect(write?.currentPeriodEnd).toBe(new Date(NOW + 30 * DAY).toISOString());
  });

  it('keeps access through a BILLING_ISSUE, which is a grace period rather than an ending', () => {
    const [write] = entitlementWrites(event({ type: 'BILLING_ISSUE' }), NOW);
    expect(write?.subscriptionStatus).toBe('active');
  });

  it('ends access on EXPIRATION', () => {
    const [write] = entitlementWrites(
      event({ type: 'EXPIRATION', expiration_at_ms: NOW - DAY }),
      NOW,
    );
    expect(write?.subscriptionStatus).toBe('free');
  });

  it('ends access on EXPIRATION even if the expiry it carries is somehow ahead', () => {
    // Belt and braces: the type is unambiguous here and must win.
    const [write] = entitlementWrites(event({ type: 'EXPIRATION' }), NOW);
    expect(write?.subscriptionStatus).toBe('free');
  });

  it('reads a trial as a trial, which v_entitlement also counts as full access', () => {
    const [write] = entitlementWrites(event({ period_type: 'TRIAL' }), NOW);
    expect(write?.subscriptionStatus).toBe('trialing');
  });

  it('treats a purchase with no expiry as not lapsing', () => {
    const [write] = entitlementWrites(event({ expiration_at_ms: null }), NOW);
    expect(write?.subscriptionStatus).toBe('active');
    expect(write?.currentPeriodEnd).toBeNull();
  });

  it('survives out-of-order delivery, because the answer comes from the expiry', () => {
    // A RENEWAL that arrives AFTER the EXPIRATION it supersedes still lands on "active", because
    // nothing here depends on the order events were seen in.
    const late = entitlementWrites(event({ type: 'RENEWAL', expiration_at_ms: NOW + 365 * DAY }), NOW);
    expect(late[0]?.subscriptionStatus).toBe('active');

    // And a stale RENEWAL whose period has already run out does not resurrect access.
    const stale = entitlementWrites(event({ type: 'RENEWAL', expiration_at_ms: NOW - DAY }), NOW);
    expect(stale[0]?.subscriptionStatus).toBe('free');
  });

  it('moves access across both accounts on a TRANSFER', () => {
    const writes = entitlementWrites(
      event({
        type: 'TRANSFER',
        app_user_id: undefined,
        transferred_from: ['aaaaaaaa-0000-0000-0000-000000000000'],
        transferred_to: ['bbbbbbbb-0000-0000-0000-000000000000'],
      }),
      NOW,
    );

    expect(writes).toEqual([
      { userId: 'aaaaaaaa-0000-0000-0000-000000000000', subscriptionStatus: 'free', currentPeriodEnd: null },
      {
        userId: 'bbbbbbbb-0000-0000-0000-000000000000',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(NOW + 30 * DAY).toISOString(),
      },
    ]);
  });

  it('ignores an event about somebody else’s entitlement', () => {
    expect(entitlementWrites(event({ entitlement_ids: ['some_other_product'] }), NOW)).toEqual([]);
  });

  it('acts on an event that names no entitlement at all', () => {
    // Dropping these would be the dangerous direction: a missed EXPIRATION leaves a lapsed
    // subscriber with the full catalogue.
    const writes = entitlementWrites(event({ entitlement_ids: null, type: 'EXPIRATION' }), NOW);
    expect(writes[0]?.subscriptionStatus).toBe('free');
  });

  it('does nothing for a dashboard test ping', () => {
    expect(entitlementWrites(event({ type: 'TEST' }), NOW)).toEqual([]);
  });

  it('does nothing when there is no user to act on', () => {
    expect(entitlementWrites(event({ app_user_id: undefined, original_app_user_id: undefined }), NOW)).toEqual([]);
  });

  it('falls back to the original app user id', () => {
    const writes = entitlementWrites(
      event({ app_user_id: undefined, original_app_user_id: 'cccccccc-0000-0000-0000-000000000000' }),
      NOW,
    );
    expect(writes[0]?.userId).toBe('cccccccc-0000-0000-0000-000000000000');
  });
});

describe('the shared secret', () => {
  it('accepts the configured secret and nothing else', () => {
    expect(secretMatches('s3cret', 's3cret')).toBe(true);
    expect(secretMatches('s3crey', 's3cret')).toBe(false);
    expect(secretMatches('s3cre', 's3cret')).toBe(false);
    expect(secretMatches('s3crett', 's3cret')).toBe(false);
  });

  it('refuses a missing header rather than treating it as a match', () => {
    expect(secretMatches(null, 's3cret')).toBe(false);
    expect(secretMatches(undefined, 's3cret')).toBe(false);
    expect(secretMatches('', 's3cret')).toBe(false);
  });

  it('refuses everything when the secret is unset, rather than letting anyone through', () => {
    expect(secretMatches('', '')).toBe(false);
    expect(secretMatches('anything', '')).toBe(false);
  });
});
