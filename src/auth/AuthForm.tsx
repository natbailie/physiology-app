import { useId, useState, type FormEvent } from 'react';
import { TERMS_VERSION } from '@/shared/legal/business';
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
  const [agreed, setAgreed] = useState(false);
  const ids = useId();
  const errorId = `${ids}-error`;
  const hintId = `${ids}-hint`;
  const agreeId = `${ids}-agree`;

  const wide = layout === 'wide' ? styles.wide : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    // `required` on the checkbox stops most submits first; this is the backstop, with words.
    if (mode === 'create' && !agreed) {
      setError('To create an account, confirm you are 18 or over and agree to the Terms.');
      document.getElementById(agreeId)?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'create'
          ? await signUp(email.trim(), password, TERMS_VERSION)
          : await signIn(email.trim(), password);
      if (!result.ok) setError(result.message);
      else if (result.needsConfirmation) setAwaitingConfirmation(true);
    } finally {
      setBusy(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      // A status region, and it replaces the form: without the role the learner who just pressed
      // "Create account" hears nothing, because the button they were on has gone.
      <p className={styles.muted} role="status">
        Nearly there — confirm your email address using the link we just sent, then sign in.
      </p>
    );
  }

  return (
    <div className={`${styles.form} ${wide}`}>
      <div className={styles.modeRow} role="group" aria-label="Sign in or create an account">
        <button
          type="button"
          aria-pressed={mode === 'signIn'}
          className={`${styles.modeButton} ${mode === 'signIn' ? styles.modeActive : ''}`}
          onClick={() => setMode('signIn')}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === 'create'}
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
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
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
            aria-invalid={error ? true : undefined}
            aria-describedby={[mode === 'create' ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
            className={styles.input}
          />
        </label>

        {mode === 'create' && (
          <p id={hintId} className={styles.hint}>
            Six characters minimum. We send a confirmation link before the account goes live.
          </p>
        )}

        {mode === 'create' && (
          <div className={styles.agreeRow}>
            <input
              id={agreeId}
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor={agreeId} className={styles.agreeLabel}>
              I&rsquo;m 18 or over and I agree to the{' '}
              <a href="#terms" className={styles.inlineLink}>
                Terms
              </a>
              . I&rsquo;ve read the{' '}
              <a href="#privacy" className={styles.inlineLink}>
                Privacy policy
              </a>
              .
            </label>
          </div>
        )}

        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={styles.primaryButton}>
          {busy ? 'One moment…' : mode === 'create' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {mode === 'signIn' && (
        <p className={styles.hint}>
          By signing in you continue to agree to the{' '}
          <a href="#terms" className={styles.inlineLink}>
            Terms
          </a>
          . See how we use your data in the{' '}
          <a href="#privacy" className={styles.inlineLink}>
            Privacy policy
          </a>
          .
        </p>
      )}
    </div>
  );
}
