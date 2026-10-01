import { useId, useState, type FormEvent } from 'react';
import { TERMS_VERSION } from '@/shared/legal/business';
import { useAuth } from './AuthContext';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULE_LABELS,
  WEAK_PASSWORD_MESSAGE,
  checkPassword,
  isStrongPassword,
  type PasswordChecks,
} from './passwordRules';
import styles from './AuthForm.module.css';

type AuthMode = 'signIn' | 'create';

/** Deliberately loose: one @, something either side, a dot after it. The server is the authority. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  /** One error at a time, tagged with the field it belongs to so it is drawn beside that field. */
  const [problem, setProblem] = useState<{ where: 'email' | 'password' | 'agree' | 'form'; text: string } | null>(
    null,
  );
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const ids = useId();
  const errorId = `${ids}-error`;
  const emailId = `${ids}-email`;
  const hintId = `${ids}-hint`;
  const agreeId = `${ids}-agree`;
  const passwordId = `${ids}-password`;
  const checks = checkPassword(password);

  const wide = layout === 'wide' ? styles.wide : '';

  const fail = (where: 'email' | 'password' | 'agree' | 'form', text: string, focusId?: string) => {
    setProblem({ where, text });
    if (focusId) document.getElementById(focusId)?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    // The form is `noValidate`, so the browser's own one-at-a-time tooltips never get in first and
    // each problem is written out next to the field it is about, in words.
    if (email.trim() === '') return fail('email', 'Add your email address so we know who you are.', emailId);
    if (!EMAIL_SHAPE.test(email.trim())) {
      return fail('email', "That doesn't look like an email address. Check for a typo before the @ or after the dot.", emailId);
    }
    if (password === '') return fail('password', 'Enter your password to continue.', passwordId);
    if (mode === 'create' && !isStrongPassword(password)) {
      return fail('password', WEAK_PASSWORD_MESSAGE, passwordId);
    }
    if (mode === 'create' && !agreed) {
      return fail('agree', 'To create an account, confirm you are 18 or over and agree to the Terms.', agreeId);
    }
    setBusy(true);
    setProblem(null);
    try {
      const result =
        mode === 'create'
          ? await signUp(email.trim(), password, TERMS_VERSION)
          : await signIn(email.trim(), password);
      if (!result.ok) setProblem({ where: 'form', text: result.message });
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

      <form className={`${styles.form} ${wide}`} noValidate onSubmit={(e) => void submit(e)}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={emailId}>
            Email
          </label>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            placeholder="you@university.ac.uk"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={problem?.where === 'email' ? true : undefined}
            aria-describedby={problem?.where === 'email' ? errorId : undefined}
            className={styles.input}
          />
          {problem?.where === 'email' && <FieldError id={errorId} text={problem.text} />}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={passwordId}>
            Password
          </label>
          <input
            id={passwordId}
            type="password"
            required
            minLength={mode === 'create' ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            aria-invalid={problem?.where === 'password' ? true : undefined}
            aria-describedby={
              [mode === 'create' ? hintId : '', problem?.where === 'password' ? errorId : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={styles.input}
          />
          {problem?.where === 'password' && <FieldError id={errorId} text={problem.text} />}
        </div>

        {mode === 'create' && (
          <div id={hintId} className={styles.hint}>
            <ul className={styles.rules} aria-label="Password requirements">
              {(Object.keys(PASSWORD_RULE_LABELS) as (keyof PasswordChecks)[]).map((rule) => (
                <li key={rule} className={checks[rule] ? styles.ruleMet : styles.rule}>
                  {/* Words as well as a mark, so the state never rests on colour alone. */}
                  <span aria-hidden="true">{checks[rule] ? '✓' : '○'}</span> {PASSWORD_RULE_LABELS[rule]}
                  <span className={styles.srOnly}>{checks[rule] ? ' (met)' : ' (not met)'}</span>
                </li>
              ))}
            </ul>
            We send a confirmation link before the account goes live.
          </div>
        )}

        {mode === 'create' && (
          <div className={styles.agreeRow}>
            <input
              id={agreeId}
              type="checkbox"
              required
              aria-describedby={problem?.where === 'agree' ? errorId : undefined}
              aria-invalid={problem?.where === 'agree' ? true : undefined}
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

        {problem?.where === 'agree' && <FieldError id={errorId} text={problem.text} />}
        {problem?.where === 'form' && <FieldError id={errorId} text={problem.text} />}

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

/** A problem, drawn beside the field it is about: a mark and words, never colour alone. */
function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} className={styles.error} role="alert">
      <span aria-hidden="true" className={styles.errorMark}>
        !
      </span>
      {text}
    </p>
  );
}
