import { useEffect, useRef } from 'react';
import { closeCookieSettings, decide, useConsent } from './consent';
import styles from './CookieBanner.module.css';

/**
 * The cookie choice, asked once.
 *
 * In the page flow at the top rather than fixed over it: a fixed bar would sit on top of
 * whatever a keyboard user tabs to (WCAG 2.4.11), and there is no modal — the site works
 * identically whichever way somebody answers, so nothing is blocked behind the question.
 *
 * The two answers are the same button style, same size, side by side. Making "Accept" the
 * prominent one is exactly the nudge the ICO's guidance on consent says not to build.
 */
export function CookieBanner() {
  const { bannerOpen, reopened, consent } = useConsent();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Reopened from "Cookie settings" at the foot of the page: take focus there, or a keyboard
  // user presses the button and nothing visible happens near them.
  useEffect(() => {
    if (reopened) {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [reopened]);

  if (!bannerOpen) return null;

  return (
    <section className={styles.banner} aria-labelledby="cookie-banner-title">
      <div className={styles.text}>
        <h2 id="cookie-banner-title" className={styles.title} tabIndex={-1} ref={headingRef}>
          Cookies
        </h2>
        <p className={styles.body}>
          We use a few essential items to keep you signed in and remember your settings. We&rsquo;d also
          like to use Google Analytics cookies to count visits and see which pages help. Analytics only
          runs if you accept.{' '}
          <a href="#cookies" className={styles.link}>
            Cookie policy
          </a>
        </p>
        {reopened && consent && (
          <p className={styles.current} role="status">
            Your current choice: analytics {consent.analytics ? 'accepted' : 'rejected'}.
          </p>
        )}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.choice} onClick={() => decide(true)}>
          Accept analytics
        </button>
        <button type="button" className={styles.choice} onClick={() => decide(false)}>
          Reject analytics
        </button>
        {reopened && consent && (
          <button type="button" className={styles.dismiss} onClick={closeCookieSettings}>
            Keep my choice
          </button>
        )}
      </div>
    </section>
  );
}
