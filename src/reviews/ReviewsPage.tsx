import { useEffect, useId, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ThemeBar } from '@/theme/ThemeBar';
import { BUSINESS } from '@/shared/legal/business';
import {
  MODERATION_POLICY,
  REVIEW_BODY_MAX,
  REVIEW_NAME_MAX,
  deleteOwnReview,
  fetchOwnReview,
  fetchPublishedReviews,
  saveReview,
  summarise,
  type OwnReview,
  type PublishedReview,
} from '@/shared/reviews/reviews';
import styles from './ReviewsPage.module.css';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span className={styles.starsEmpty}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

/**
 * Reviews, from signed-in learners, moderated by a person, every published one shown.
 *
 * The count and average are computed from the published rows on every load. Nowhere in either
 * app is a rating typed in, and there are no seeded or sample reviews — an empty page says so.
 */
export function ReviewsPage() {
  const [reviews, setReviews] = useState<PublishedReview[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    void fetchPublishedReviews().then((rows) => {
      if (rows) setReviews(rows);
      else setFailed(true);
    });
  };

  useEffect(load, []);

  const summary = summarise(reviews ?? []);

  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.standfirst}>What learners say about Physiology Lab — good and bad.</p>
      </header>

      <section aria-labelledby="reviews-summary" className={styles.section}>
        <h2 id="reviews-summary" className={styles.sectionTitle}>
          Summary
        </h2>
        {!isSupabaseConfigured ? (
          <p className={styles.prose}>Reviews are not available on this deployment.</p>
        ) : reviews === null && !failed ? (
          <p className={styles.prose} aria-busy="true">
            Loading reviews…
          </p>
        ) : failed ? (
          <p className={styles.prose} role="alert">
            Reviews could not be loaded just now. Try again later.
          </p>
        ) : summary.count === 0 ? (
          <p className={styles.prose}>No reviews have been published yet. Be the first to write one.</p>
        ) : (
          <div className={styles.summary}>
            <p className={styles.average}>
              <span className={`${styles.averageNumber} numeral`}>{summary.average?.toFixed(1)}</span>
              <span className={styles.averageOf}>out of 5, from {summary.count} review{summary.count === 1 ? '' : 's'}</span>
            </p>
            <table className={styles.distribution}>
              <caption className="sr-only">Number of reviews at each rating</caption>
              <tbody>
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.distribution[star - 1] ?? 0;
                  return (
                    <tr key={star}>
                      <th scope="row">{star} star{star === 1 ? '' : 's'}</th>
                      <td>
                        <span className={styles.bar} aria-hidden="true">
                          <span className={styles.barFill} style={{ width: `${(n / summary.count) * 100}%` }} />
                        </span>
                      </td>
                      <td className={styles.barCount}>{n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reviews && reviews.length > 0 && (
        <section aria-labelledby="reviews-list" className={styles.section}>
          <h2 id="reviews-list" className={styles.sectionTitle}>
            All published reviews
          </h2>
          <ol className={styles.list}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.review}>
                <article aria-label={`Review by ${review.displayName ?? 'a learner'}`}>
                  <Stars rating={review.rating} />
                  <p className={styles.body}>{review.body}</p>
                  <p className={styles.meta}>
                    {review.displayName ?? 'A learner'} ·{' '}
                    <time dateTime={review.createdAt}>{DATE.format(new Date(review.createdAt))}</time> ·{' '}
                    <a
                      className={styles.report}
                      href={`mailto:${BUSINESS.contactEmail}?subject=${encodeURIComponent(`Report review ${review.id}`)}`}
                    >
                      Report this review
                    </a>
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </section>
      )}

      {isSupabaseConfigured && <WriteReview onSaved={load} />}

      <section aria-labelledby="reviews-policy" className={styles.section}>
        <h2 id="reviews-policy" className={styles.sectionTitle}>
          How reviews work
        </h2>
        <ul className={styles.policy}>
          {MODERATION_POLICY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WriteReview({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const ids = useId();
  const [own, setOwn] = useState<OwnReview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchOwnReview(user.id).then((existing) => {
      if (cancelled) return;
      setOwn(existing);
      if (existing) {
        setRating(existing.rating);
        setBody(existing.body);
        setDisplayName(existing.displayName ?? '');
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <section aria-labelledby="reviews-write" className={styles.section}>
        <h2 id="reviews-write" className={styles.sectionTitle}>
          Write a review
        </h2>
        <p className={styles.prose}>
          <a href="#account" className={styles.link}>
            Sign in or create an account
          </a>{' '}
          to write a review.
        </p>
      </section>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus('');
    const result = await saveReview(user.id, { rating, body, displayName }, own !== null);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOwn({ rating, body: body.trim(), displayName: displayName.trim() || null, status: 'pending', rejectionReason: null });
    setStatus('Thank you. Your review will appear once it has been checked — usually within a few days.');
    onSaved();
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const result = await deleteOwnReview(user.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOwn(null);
    setRating(0);
    setBody('');
    setDisplayName('');
    setStatus('Your review has been deleted.');
    onSaved();
  };

  const errorId = `${ids}-error`;

  return (
    <section aria-labelledby="reviews-write" className={styles.section}>
      <h2 id="reviews-write" className={styles.sectionTitle}>
        {own ? 'Your review' : 'Write a review'}
      </h2>
      {own && (
        <p className={styles.prose}>
          {own.status === 'published'
            ? 'Your review is published. Editing it sends it back to be checked again.'
            : own.status === 'pending'
              ? 'Your review is waiting to be checked.'
              : `Your review was not published${own.rejectionReason ? `: ${own.rejectionReason}` : ''}. You can edit it and send it again.`}
        </p>
      )}
      {!loaded ? (
        <p className={styles.prose} aria-busy="true">
          Loading…
        </p>
      ) : (
        <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
          <fieldset className={styles.ratingField}>
            <legend className={styles.label}>Your rating</legend>
            <div className={styles.ratingOptions}>
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className={styles.ratingOption}>
                  <input
                    type="radio"
                    name={`${ids}-rating`}
                    value={star}
                    checked={rating === star}
                    onChange={() => setRating(star)}
                    className={styles.ratingRadio}
                  />
                  <span>
                    {star} star{star === 1 ? '' : 's'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className={styles.label} htmlFor={`${ids}-body`}>
            Your review
          </label>
          <textarea
            id={`${ids}-body`}
            className={styles.textarea}
            rows={5}
            maxLength={REVIEW_BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-describedby={`${ids}-body-hint${error ? ` ${errorId}` : ''}`}
            aria-invalid={error ? true : undefined}
          />
          <p id={`${ids}-body-hint`} className={styles.hint}>
            Your own experience of using Physiology Lab, 10 to {REVIEW_BODY_MAX} characters. Please don&rsquo;t
            include anyone&rsquo;s personal details.
          </p>

          <label className={styles.label} htmlFor={`${ids}-name`}>
            Name to show (optional)
          </label>
          <input
            id={`${ids}-name`}
            className={styles.input}
            maxLength={REVIEW_NAME_MAX}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            aria-describedby={`${ids}-name-hint`}
          />
          <p id={`${ids}-name-hint`} className={styles.hint}>
            Leave blank to appear as &ldquo;A learner&rdquo;. A first name or &ldquo;F2 doctor&rdquo; works well.
          </p>

          {error && (
            <p id={errorId} className={styles.error} role="alert">
              {error}
            </p>
          )}
          <p className={styles.status} role="status">
            {status}
          </p>

          <div className={styles.actions}>
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Saving…' : own ? 'Update review' : 'Submit review'}
            </button>
            {own && (
              <button type="button" className={styles.delete} disabled={busy} onClick={() => void remove()}>
                Delete my review
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
