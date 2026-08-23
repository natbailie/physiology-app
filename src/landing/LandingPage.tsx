import { AuthForm } from '@/auth/AuthForm';
import { MODULES } from '@/home/moduleRegistry';
import styles from './LandingPage.module.css';

const SIMULATOR_COUNT = MODULES.filter((m) => m.kind !== 'reference' && m.status === 'available').length;

/**
 * The signed-out screen. Every route renders this until there is a session, so it is the whole
 * product surface for a new visitor — keep it to the one decision they need to make.
 */
export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Physiology Lab</h1>
          <p className={styles.subtitle}>
            {SIMULATOR_COUNT} interactive feedback-loop simulators and the reasoning practice that goes with
            them — pre-med through resident level (UKMLA, USMLE, MRCP). Sign in to pick up where you left off.
          </p>
        </div>
        <div className={styles.rule} />
        <AuthForm layout="wide" />
      </div>

      <p className={styles.footer}>
        <a href="#pricing" className={styles.pricingLink}>
          See what a subscription includes
        </a>
        <span>
          Simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
        </span>
      </p>
    </div>
  );
}
