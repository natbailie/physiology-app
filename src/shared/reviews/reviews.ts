import { supabase } from '@/lib/supabase';

/**
 * Learner reviews: one per account, human-moderated, every published one shown.
 *
 * Shared verbatim with the phone app. The rules live in `supabase/schema-reviews.sql`; this file
 * only reads the public view and writes the learner's own row. Nothing here can publish a review
 * or set a rating anyone else sees — that is the point, and the DMCC Act 2024 fake-review rules
 * are why: a review page is only honest if its numbers come from the rows.
 */

export interface PublishedReview {
  id: string;
  rating: number;
  body: string;
  displayName: string | null;
  createdAt: string;
}

export type ReviewStatus = 'pending' | 'published' | 'rejected';

export interface OwnReview {
  rating: number;
  body: string;
  displayName: string | null;
  status: ReviewStatus;
  rejectionReason: string | null;
}

export interface ReviewDraft {
  rating: number;
  body: string;
  displayName: string;
}

export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 1000;
export const REVIEW_NAME_MAX = 40;

/** The moderation policy, stated once for both apps. */
export const MODERATION_POLICY = [
  'Only people with an account can write a review, and only one each.',
  'Every review is read by a person before it appears. We publish positive and negative reviews alike.',
  'We only reject reviews that are abusive, spam, off-topic, contain personal information, or are not about the writer\'s own experience.',
  'We never pay for reviews or offer anything in return for them, and we do not write them ourselves.',
  'The average rating is calculated from every published review.',
] as const;

/** Null when the draft is acceptable, otherwise what to fix. Mirrors the table's checks. */
export function validateReview(draft: ReviewDraft): string | null {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
    return 'Choose a rating from 1 to 5 stars.';
  }
  const body = draft.body.trim();
  if (body.length < REVIEW_BODY_MIN) return `Write at least ${REVIEW_BODY_MIN} characters.`;
  if (body.length > REVIEW_BODY_MAX) return `Keep it under ${REVIEW_BODY_MAX} characters.`;
  if (draft.displayName.trim().length > REVIEW_NAME_MAX) return `Keep the name under ${REVIEW_NAME_MAX} characters.`;
  return null;
}

export interface ReviewSummary {
  count: number;
  /** One decimal place; null when there is nothing to average. */
  average: number | null;
  /** Count per star, index 0 = one star. */
  distribution: [number, number, number, number, number];
}

export function summarise(reviews: readonly Pick<PublishedReview, 'rating'>[]): ReviewSummary {
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let total = 0;
  for (const { rating } of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(rating)));
    distribution[star - 1] = (distribution[star - 1] ?? 0) + 1;
    total += star;
  }
  return {
    count: reviews.length,
    average: reviews.length === 0 ? null : Math.round((total / reviews.length) * 10) / 10,
    distribution,
  };
}

interface PublishedRow {
  id: string;
  rating: number;
  body: string;
  display_name: string | null;
  created_at: string;
}

export async function fetchPublishedReviews(): Promise<PublishedReview[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('v_published_reviews')
    .select('id, rating, body, display_name, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error || !data) return null;
  return (data as PublishedRow[]).map((row) => ({
    id: row.id,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    createdAt: row.created_at,
  }));
}

export async function fetchOwnReview(userId: string): Promise<OwnReview | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select('rating, body, display_name, status, rejection_reason')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { rating: number; body: string; display_name: string | null; status: ReviewStatus; rejection_reason: string | null };
  return {
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    status: row.status,
    rejectionReason: row.rejection_reason,
  };
}

export type SaveReviewResult = { ok: true } | { ok: false; message: string };

/** Creates the learner's review, or replaces it (which sends it back for moderation). */
export async function saveReview(userId: string, draft: ReviewDraft, existing: boolean): Promise<SaveReviewResult> {
  const invalid = validateReview(draft);
  if (invalid) return { ok: false, message: invalid };
  if (!supabase) return { ok: false, message: 'Reviews are not available on this deployment.' };
  const fields = {
    rating: draft.rating,
    body: draft.body.trim(),
    display_name: draft.displayName.trim() === '' ? null : draft.displayName.trim(),
  };
  const { error } = existing
    ? await supabase.from('reviews').update(fields).eq('user_id', userId)
    : await supabase.from('reviews').insert({ user_id: userId, ...fields });
  if (error) {
    return {
      ok: false,
      message: error.message.includes('duplicate')
        ? 'You have already written a review — edit it instead.'
        : 'Your review could not be saved just now. Try again in a moment.',
    };
  }
  return { ok: true };
}

export async function deleteOwnReview(userId: string): Promise<SaveReviewResult> {
  if (!supabase) return { ok: false, message: 'Reviews are not available on this deployment.' };
  const { error } = await supabase.from('reviews').delete().eq('user_id', userId);
  return error ? { ok: false, message: 'Your review could not be deleted just now.' } : { ok: true };
}
