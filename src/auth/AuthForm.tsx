import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';
import styles from './AuthForm.module.css';

type AuthMode = 'signIn' | 'create';

interface AuthFormProps {
  /** 'wide' stretches the controls to the container — used where the form is the whole page. */
  layout?: 'inline' | 'wide';
}

/**
 * Email/password sign-in and account creation.
 *
 * Lives in `auth/` rather than on a page because two places need it: the landing gate every
 * signed-out visitor meets, and the account page.
 */
export function AuthForm({ layout = 'inline' }: AuthFormProps) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const wide = layout === 'wide' ? styles.wide : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'create' ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      if (!result.ok) setError(result.message);
      else if (result.needsConfirmation) setAwaitingConfirmation(true);
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
    <div className={`${styles.form} ${wide}`}>
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

      <form className={`${styles.form} ${wide}`} onSubmit={(e) => void submit(e)}>
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
        <p className={styles.hint}>
          Six characters minimum. We send a confirmation link before the account goes live.
        </p>
      )}
    </div>
  );
}
