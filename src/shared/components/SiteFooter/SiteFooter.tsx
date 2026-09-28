import { openCookieSettings } from '@/analytics/consent';
import { BUSINESS, LEGAL_DOC_ORDER, LEGAL_LINK_LABELS } from '@/shared/legal';
import styles from './SiteFooter.module.css';

/**
 * The one footer, on every route including the signed-out landing screen: every legal document
 * one click from anywhere, the trader named (E-Commerce Regulations 2002 reg. 6), and the way
 * back to the cookie choice — withdrawing consent has to be as easy as giving it.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="Legal and site information">
        <ul className={styles.links}>
          {LEGAL_DOC_ORDER.map((id) => (
            <li key={id}>
              <a href={`#${id}`} className={styles.link}>
                {LEGAL_LINK_LABELS[id]}
              </a>
            </li>
          ))}
          <li>
            <a href="#reviews" className={styles.link}>
              Reviews
            </a>
          </li>
          <li>
            <a href="#methodology" className={styles.link}>
              How the physiology is checked
            </a>
          </li>
          <li>
            <a href="#pricing" className={styles.link}>
              Pricing
            </a>
          </li>
          <li>
            <button type="button" className={styles.settings} onClick={openCookieSettings}>
              Cookie settings
            </button>
          </li>
        </ul>
      </nav>
      <p className={styles.note}>
        Simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
        Not affiliated with or endorsed by any exam body.
      </p>
      <p className={styles.note}>
        © {new Date().getFullYear()} {BUSINESS.legalName}, trading as {BUSINESS.tradingName}.{' '}
        <a href={`mailto:${BUSINESS.contactEmail}`} className={styles.link}>
          {BUSINESS.contactEmail}
        </a>
      </p>
    </footer>
  );
}
