import { useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
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
  const { user, initialising, signUp, signIn, signOut } = useAuth();

  if (initialising) {
    return <p className={styles.muted}>Checking whether you are still signed in…</p>;
  }
  if (user) {
    return <SignedInView email={user.email} onSignOut={() => void signOut()} />;
  }
  return <AuthForm onSignUp={signUp} onSignIn={signIn} />;
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

type AuthMode = 'signIn' | 'create';

function AuthForm({
  onSignUp,
  onSignIn,
}: {
  onSignUp: (email: string, password: string) => Promise<{ ok: boolean; message?: string; needsConfirmation?: boolean }>;
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'create' ? await onSignUp(email.trim(), password) : await onSignIn(email.trim(), password);
      if (!result.ok && result.message) setError(result.message);
      if ('needsConfirmation' in result && result.needsConfirmation) setAwaitingConfirmation(true);
    } finally {
      setBusy(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <p className={styles.muted}>
        Nearly there — confirm your email address using the link we just sent, then sign in.
      </p>
    );
  }

  return (
    <section className={styles.body}>
      <div className={styles.modeRow}>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'signIn' ? styles.modeActive : ''}`}
          onClick={() => setMode('signIn')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'create' ? styles.modeActive : ''}`}
          onClick={() => setMode('create')}
        >
          Create account
        </button>
      </div>

      <form className={styles.form} onSubmit={(e) => void submit(e)}>
        <label className={styles.label}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            className={styles.input}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={busy} className={styles.primaryButton}>
          {busy ? 'One moment…' : mode === 'create' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {mode === 'create' && (
        <p className={styles.hint}>Six characters minimum. We send a confirmation link before the account goes live.</p>
      )}
    </section>
  );
}
