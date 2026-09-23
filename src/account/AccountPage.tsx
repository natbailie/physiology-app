import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AuthForm } from '@/auth/AuthForm';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { MODULES } from '@/home/moduleRegistry';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useEntitlement } from '@/billing/useEntitlement';
import { EXAMS, TRAINING_LEVELS, isExamId, isTrainingLevelId } from '@/home/exams';
import { setExamFilter } from '@/home/examFilter';
import { useExamProfile } from './examProfile';
import styles from './AccountPage.module.css';
import { useRole } from '@/teacher/useTeacher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { ThemeBar } from '@/theme/ThemeBar';

const SIMULATORS = MODULES.filter((m) => m.kind !== 'reference');

export function AccountPage() {
  return (
    <div className={styles.page}>
      <ThemeBar />
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
      <a href="#methodology" className={styles.footerLink}>
        How the physiology is checked
      </a>
      <TeacherLink />
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
 * The learner's exam and training stage, editable for as long as they have the account.
 *
 * The home page asks this once and can be dismissed forever; this is where it lives afterwards.
 * Both matter beyond the filter — they are the RevenueCat subscriber attributes that make the
 * audience segmentable — so both need somewhere permanent to be corrected when a learner moves
 * from finals to the MRCP.
 *
 * Saved on change rather than behind a Save button. There are two fields, neither is destructive,
 * and a form that can be left in an unsaved state is a form somebody leaves in an unsaved state.
 */
function ExamSettings() {
  const { targetExam, trainingLevel, ready, canSave, save } = useExamProfile();
  const [failed, setFailed] = useState(false);

  if (!ready) return <p className={styles.muted}>Loading…</p>;

  const update = (next: Parameters<typeof save>[0]) => {
    setFailed(false);
    void save(next).then((ok) => setFailed(!ok));
  };

  return (
    <>
      <p className={styles.muted}>
        Filters the catalogue to what is high-yield for your exam, and nothing else changes — every
        module stays open. Leave it on “Not sure yet” to see all of them.
      </p>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="target-exam">
          Exam
        </label>
        <select
          id="target-exam"
          className={styles.select}
          value={targetExam ?? ''}
          disabled={!canSave}
          onChange={(event) => {
            const value = event.target.value;
            // Empty string is "not sure yet", stored as null — see `examProfile.ts` for why
            // there is no sentinel string for it.
            update({ targetExam: isExamId(value) ? value : null });
            setExamFilter(isExamId(value) ? value : null);
          }}
        >
          <option value="">Not sure yet</option>
          {EXAMS.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="training-level">
          Stage
        </label>
        <select
          id="training-level"
          className={styles.select}
          value={trainingLevel ?? ''}
          disabled={!canSave}
          onChange={(event) => {
            const value = event.target.value;
            update({ trainingLevel: isTrainingLevelId(value) ? value : null });
          }}
        >
          <option value="">Prefer not to say</option>
          {TRAINING_LEVELS.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      {failed && <p className={styles.error}>That did not save. Check your connection and try again.</p>}
    </>
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

      <h2 className={styles.sectionTitle}>Revising for</h2>
      <ExamSettings />

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

/** Shown only to teaching accounts: a link a student cannot use is clutter, and the page behind
 * it would only tell them so. */
function TeacherLink() {
  const role = useRole();
  if (role !== 'teacher') return null;
  return (
    <a href="#teacher" className={styles.footerLink}>
      Your classes
    </a>
  );
}
