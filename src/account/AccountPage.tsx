import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AuthForm } from '@/auth/AuthForm';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { MODULES } from '@/home/moduleRegistry';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useEntitlement } from '@/billing/useEntitlement';
import styles from './AccountPage.module.css';
import { ThemeToggle } from '@/theme/ThemeToggle';

const SIMULATORS = MODULES.filter((m) => m.kind !== 'reference');

export function AccountPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your account</h1>
      </header>
      {/* Reachable without a session: the theme is a device preference, not account data. */}
      <section className={styles.body}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <ThemeToggle />
      </section>
      {isSupabaseConfigured ? <AccountBody /> : <LocalOnlyNotice />}
      <a href="#privacy" className={styles.footerLink}>
        What data do we hold?
      </a>
    </div>
  );
}

function AccountBody() {
  const { user, initialising, signOut, deleteAccount } = useAuth();

  if (initialising) {
    return <p className={styles.muted}>Checking whether you are still signed in…</p>;
  }
  if (user) {
    return (
      <>
        <SignedInView email={user.email} onSignOut={() => void signOut()} />
        <DangerZone onDelete={() => deleteAccount()} />
      </>
    );
  }
  return (
    <section className={styles.body}>
      <AuthForm />
    </section>
  );
}

/**
 * Two-step confirmation: the first click arms the button, the second commits. Deletion is
 * immediate and server-side — there is no grace period to restore from, so the friction
 * has to live here rather than in a "contact support" queue.
 */
function DangerZone({ onDelete }: { onDelete: () => Promise<{ ok: boolean; message?: string }> }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async () => {
    if (!armed || busy) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await onDelete();
    if (result.ok) {
      // The session is dead server-side; land somewhere sane rather than on a signed-out account page.
      window.location.hash = '#home';
      return;
    }
    setArmed(false);
    setBusy(false);
    setError(result.message ?? 'Something went wrong — nothing was deleted.');
  };

  return (
    <section className={styles.dangerZone}>
      <h2 className={styles.sectionTitle}>Danger zone</h2>
      <p className={styles.muted}>
        Deleting your account removes your email address, every recorded answer and your access
        rights from our servers straight away. There is no way back.
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="button"
        className={`${styles.dangerButton} ${armed ? styles.dangerArmed : ''}`}
        onClick={() => void act()}
      >
        {busy ? 'Deleting…' : armed ? 'Click again to delete permanently' : 'Delete my account…'}
      </button>
    </section>
  );
}

/**
 * Which of the two revenue streams is paying for this learner.
 *
 * Worth saying out loud rather than just showing a padlock or not: a student whose school has
 * bought a seat may ALSO be paying us themselves, and has no way to discover that unless we tell
 * them. Quietly taking both is not a thing this product should do.
 */
function AccessSummary() {
  const { status, source, institutionName } = useEntitlement();

  if (status === 'loading') return <p className={styles.muted}>Checking your access…</p>;

  if (status === 'free') {
    return (
      <p className={styles.muted}>
        Free account — the three free simulators and the reference pages.{' '}
        <a href="#pricing" className={styles.moduleLink}>
          See what full access includes
        </a>
        .
      </p>
    );
  }

  if (source === 'institution') {
    return (
      <p className={styles.muted}>
        Full access, covered by <strong>{institutionName ?? 'your institution'}</strong>&rsquo;s licence.
        If you are also paying for a personal subscription you can cancel it — this does not depend
        on it.
      </p>
    );
  }

  if (source === 'subscription') {
    return <p className={styles.muted}>Full access through your own subscription. Cancel any time.</p>;
  }

  return <p className={styles.muted}>Full access.</p>;
}

function LocalOnlyNotice() {
  return (
    <p className={styles.muted}>
      Accounts are not configured on this deployment, so your progress is kept in this browser only.
      It will not follow you to another device.
    </p>
  );
}

function SignedInView({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const store = useProgressStore();
  const rows = SIMULATORS.map((m) => ({ module: m, summary: store.summary(m.id) })).filter(
    (r) => r.summary.attempted > 0,
  );
  const attempted = rows.reduce((t, r) => t + r.summary.attempted, 0);
  const correct = rows.reduce((t, r) => t + r.summary.correct, 0);

  return (
    <section className={styles.body}>
      <p className={styles.muted}>
        Signed in as <strong>{email}</strong>. Answers are saved against this account and follow you
        across devices.
      </p>

      <h2 className={styles.sectionTitle}>Access</h2>
      <AccessSummary />

      <h2 className={styles.sectionTitle}>Progress</h2>
      {rows.length === 0 ? (
        <p className={styles.muted}>
          No questions answered yet — pick a simulator and try a practice set.
        </p>
      ) : (
        <>
          <p className={styles.total}>
            {correct} of {attempted} answers correct ({attempted === 0 ? 0 : Math.round((correct / attempted) * 100)}%)
          </p>
          <ul className={styles.moduleList}>
            {rows.map(({ module, summary }) => (
              <li key={module.id} className={styles.moduleRow}>
                <a href={`#${module.id}`} className={styles.moduleLink}>
                  {module.name}
                </a>
                <span className={styles.moduleScore}>
                  {summary.correct}/{summary.attempted} correct
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className={styles.secondaryButton} onClick={onSignOut}>
        Sign out
      </button>
    </section>
  );
}
