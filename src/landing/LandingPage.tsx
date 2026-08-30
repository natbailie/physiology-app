import { AuthForm } from '@/auth/AuthForm';
import { BrandMark } from '@/shared/components/BrandMark/BrandMark';
import { MODULES } from '@/home/moduleRegistry';
import styles from './LandingPage.module.css';

const SIMULATOR_COUNT = MODULES.filter((m) => m.kind !== 'reference' && m.status === 'available').length;

/**
 * The signed-out screen. Every route renders this until there is a session, so it is the whole
 * product surface for a new visitor — keep it to the one decision they need to make.
 *
 * Split card: the group's brand on the ink half, the single decision on the paper half. It is
 * the same construction as the haematology app's sign-in, which is the point — for most people
 * this screen is the only place the two products are ever seen side by side.
 */
export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandPanel}>
          <BrandMark size="lg" tone="ink" as="h1" />

          <div className={styles.pitch}>
            {/* A tagline, not the page's heading. The product name above it is that — and it is
                also what a signed-out visitor is looking for when they land here. */}
            <p className={styles.headline}>
              Physiology you can <span className={styles.accent}>move</span>.
            </p>
            <p className={styles.subtitle}>
              {SIMULATOR_COUNT} interactive feedback-loop simulators and the reasoning practice that goes
              with them — pre-med through resident level (UKMLA, USMLE, MRCP).
            </p>
          </div>

          <p className={styles.panelFoot}>Simplified models built to teach mechanism</p>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHead}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formHint}>Pick up where you left off.</p>
          </div>
          <AuthForm layout="wide" />
        </div>
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
