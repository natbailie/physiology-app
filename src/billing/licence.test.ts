// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const rpcState = vi.hoisted(() => ({
  configured: true,
  data: null as unknown,
  error: null as { message: string } | null,
  calls: [] as { name: string; args: Record<string, unknown> }[],
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return rpcState.configured;
  },
  get supabase() {
    return rpcState.configured
      ? {
          rpc: async (name: string, args: Record<string, unknown>) => {
            rpcState.calls.push({ name, args });
            return { data: rpcState.data, error: rpcState.error };
          },
        }
      : null;
  },
}));

const invalidated = vi.hoisted(() => ({ count: 0 }));
vi.mock('./useEntitlement', () => ({
  invalidateEntitlement: () => {
    invalidated.count += 1;
  },
}));

import { normaliseLicenceCode, redeemLicence } from './licence';

const granted = [{ institution_name: 'Barts and The London', expires_at: '2027-07-31T00:00:00Z', cohort_id: null }];

afterEach(() => {
  rpcState.configured = true;
  rpcState.data = null;
  rpcState.error = null;
  rpcState.calls = [];
  invalidated.count = 0;
});

describe('normalising a code', () => {
  it('accepts the shapes a code arrives in — read off a slide, typed, pasted', () => {
    expect(normaliseLicenceCode('qrst uvwx yz')).toBe('QRSTUVWXYZ');
    expect(normaliseLicenceCode('qrst-uvwx-yz')).toBe('QRSTUVWXYZ');
    expect(normaliseLicenceCode('  QRSTUVWXYZ  ')).toBe('QRSTUVWXYZ');
  });

  it('leaves an empty code empty rather than inventing one', () => {
    expect(normaliseLicenceCode('   ')).toBe('');
  });
});

describe('redeeming a licence', () => {
  it('sends the normalised code and reports the institution back', async () => {
    rpcState.data = granted;

    const result = await redeemLicence('qrst-uvwx-yz');

    expect(rpcState.calls).toEqual([{ name: 'redeem_licence', args: { p_code: 'QRSTUVWXYZ' } }]);
    expect(result).toEqual({
      ok: true,
      institutionName: 'Barts and The London',
      expiresAt: '2027-07-31T00:00:00Z',
    });
  });

  it('invalidates the entitlement, so the home grid unlocks without a reload', async () => {
    rpcState.data = granted;
    await redeemLicence('QRSTUVWXYZ');
    expect(invalidated.count).toBe(1);
  });

  it('never asks the server about an empty code', async () => {
    const result = await redeemLicence('   ');
    expect(result).toEqual({ ok: false, message: 'Enter a code first.' });
    expect(rpcState.calls).toEqual([]);
  });

  it('turns each way the rpc can raise into something a learner can act on', async () => {
    const cases: [string, RegExp][] = [
      ['no licence found for that code', /not recognised/i],
      ['that licence has expired', /renew/i],
      ['that licence has no seats left', /add more/i],
      ['sign in before redeeming a licence', /sign in/i],
      ['deadlock detected', /try again/i],
    ];

    for (const [raised, expected] of cases) {
      rpcState.error = { message: raised };
      const result = await redeemLicence('QRSTUVWXYZ');
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.message).toMatch(expected);
      // A refused code must not tell the app its answer has changed.
      expect(invalidated.count).toBe(0);
    }
  });

  it('says something useful in a build with no accounts at all', async () => {
    rpcState.configured = false;
    const result = await redeemLicence('QRSTUVWXYZ');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toMatch(/already open/i);
  });
});
