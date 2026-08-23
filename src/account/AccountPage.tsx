import { useAuth } from '@/auth/AuthContext';
import { AuthForm } from '@/auth/AuthForm';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { MODULES } from '@/home/moduleRegistry';
import { isSupabaseConfigured } from '@/lib/supabase';
import styles from './AccountPage.module.css';

const SIMULATORS = MODULES.filter((m) => m.kind !== 'reference');

export function AccountPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your account</h1>
      </header>
      {isSupabaseConfigured ? <AccountBody /> : <LocalOnlyNotice />}
    </div>
  );
}

function AccountBody() {
  const { user, initialising, signOut } = useAuth();

  if (initialising) {
    return <p className={styles.muted}>Checking whether you are still signed in…</p>;
  }
  if (user) {
    return <SignedInView email={user.email} onSignOut={() => void signOut()} />;
  }
  return (
    <section className={styles.body}>
      <AuthForm />
    </section>
  );
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
