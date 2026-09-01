import { supabase } from '@/lib/supabase';
import { invalidateEntitlement } from './useEntitlement';

/**
 * Institutional licence codes.
 *
 * This replaces the old `accessCode.ts`, which held an unlock in localStorage and checked it
 * against a constant compiled into the bundle. That was a back door by construction — anyone who
 * opened devtools could read the code — and it could not express the things a real licence needs:
 * a seat count, an expiry, and which school is paying.
 *
 * A seat now lives in Postgres. Redemption goes through the `redeem_licence` rpc, which takes a
 * row lock before counting seats so two students claiming the last one cannot both get it, and
 * enrols the student in the licence's cohort when it names one. The browser stores nothing: what
 * this module returns is a report of what the server did.
 */

export type RedeemResult =
  | { ok: true; institutionName: string; expiresAt: string | null }
  | { ok: false; message: string };

interface RedeemRow {
  institution_name: string;
  expires_at: string | null;
  cohort_id: string | null;
}

/**
 * Codes are read off a slide and typed back in by a whole year group, so accept the shapes that
 * produces — lower case, spaces, the hyphens people add to make a long code readable.
 *
 * The alphabet the codes are minted from has no 0/O/1/I/L, so there is no lookalike to correct
 * here; anything outside it is a typo the server should reject rather than a character to guess at.
 */
export function normaliseLicenceCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** What the learner is told when the rpc raises. Postgres messages are for us, not for them. */
function messageFor(raised: string): string {
  if (raised.includes('no licence found')) {
    return 'That code was not recognised. Check it with whoever gave it to you.';
  }
  if (raised.includes('expired')) {
    return "That licence has expired. Your institution will need to renew it.";
  }
  if (raised.includes('no seats left')) {
    return 'That licence has no seats left. Ask your institution to add more.';
  }
  if (raised.includes('sign in')) {
    return 'Sign in first, then redeem the code.';
  }
  return 'That code could not be redeemed just now. Try again in a moment.';
}

export async function redeemLicence(code: string): Promise<RedeemResult> {
  const normalised = normaliseLicenceCode(code);
  if (normalised === '') return { ok: false, message: 'Enter a code first.' };

  if (!supabase) {
    return { ok: false, message: 'This build has no accounts, so every module is already open.' };
  }

  const { data, error } = await supabase.rpc('redeem_licence', { p_code: normalised });

  if (error) return { ok: false, message: messageFor(error.message ?? '') };

  // A set-returning function comes back as an array; one row on success.
  const row = (Array.isArray(data) ? data[0] : data) as RedeemRow | undefined;
  if (!row) return { ok: false, message: messageFor('') };

  // The seat exists now, so every consumer's memoised answer is stale.
  invalidateEntitlement();

  return {
    ok: true,
    institutionName: row.institution_name,
    expiresAt: row.expires_at ?? null,
  };
}
