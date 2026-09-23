import { useEffect, useState } from 'react';
import { MODULES } from '@/home/moduleRegistry';
import { isSupabaseConfigured } from '@/lib/supabase';
import { MIN_STUDENTS, type ModuleStanding } from './aggregate';
import { useCohorts, useCohortProgress, useRole } from './useTeacher';
import styles from './TeacherPage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

/**
 * What a class is finding hard, for the person who has to teach it again.
 *
 * This page is the reason an institution buys rather than a student. `redeem_licence` already
 * enrols a student into a cohort as they redeem their code, so a school that pays by invoice gets
 * its year group assembled here with no further admin — the licence and the class list are the
 * same act.
 *
 * **It shows aggregates and never a named student.** That is a promise made on the privacy page
 * before this existed, and it is also what keeps the data protection assessment short enough for a
 * university to sign: a per-student view is a different product with a different consent story,
 * and it is not needed to answer the question a module lead actually has.
 */

const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name] as const));

export function TeacherPage() {
  const role = useRole();
  const isTeacher = role === 'teacher';
  const { cohorts, loading, error, create } = useCohorts(isTeacher);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && cohorts.length > 0) setSelected(cohorts[0]!.id);
  }, [cohorts, selected]);

  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <p className={styles.muted}>
          Cohorts need an account, and this build is running local-only. Progress is being kept in
          this browser.
        </p>
      </Shell>
    );
  }

  if (role === 'loading') {
    return (
      <Shell>
        <p className={styles.muted}>Checking your account…</p>
      </Shell>
    );
  }

  if (role === 'signedOut') {
    return (
      <Shell>
        <p className={styles.muted}>Sign in to see the classes you teach.</p>
      </Shell>
    );
  }

  if (role === 'student') {
    return (
      <Shell>
        <p className={styles.muted}>
          This page is for teaching accounts. If you are running a course and need one, get in touch
          and we will enable it.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <CreateCohort onCreate={create} />
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Loading your classes…</p> : null}
      {!loading && cohorts.length === 0 ? (
        <p className={styles.muted}>
          No classes yet. Create one above, then give students the join code — or invoice for seats
          and the licence will enrol them for you.
        </p>
      ) : null}

      {cohorts.length > 0 ? (
        <>
          {/* Deliberately NOT `role="tablist"`. The ARIA tab pattern obliges a roving tabindex,
              arrow-key navigation and a labelled tabpanel; announcing "tab" without them promises
              a keyboard contract this does not honour, which is worse than plain buttons. Pressed
              buttons say the same thing and are true. */}
          <div className={styles.cohortBar}>
            {cohorts.map((cohort) => (
              <button
                key={cohort.id}
                type="button"
                aria-pressed={cohort.id === selected}
                className={styles.cohortTab}
                data-selected={cohort.id === selected}
                onClick={() => setSelected(cohort.id)}
              >
                {cohort.name}
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <JoinCode code={cohorts.find((c) => c.id === selected)?.join_code ?? ''} />
              <CohortReport cohortId={selected} />
            </>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>Your classes</h1>
        <p className={styles.standfirst}>
          Where a cohort is struggling, before the exam rather than after it. Figures are for the
          class as a whole — individual answers are never shown to anyone but the learner.
        </p>
      </header>
      <section className={styles.body}>{children}</section>
    </div>
  );
}

function CreateCohort({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className={styles.create}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || busy) return;
        setBusy(true);
        void onCreate(trimmed).finally(() => {
          setBusy(false);
          setName('');
        });
      }}
    >
      <label className={styles.createLabel} htmlFor="cohort-name">
        New class
      </label>
      <input
        id="cohort-name"
        className={styles.input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Year 2 physiology"
        autoComplete="off"
      />
      <button type="submit" className={styles.primary} disabled={busy || name.trim() === ''}>
        {busy ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}

/** Read aloud in a lecture theatre far more often than it is copied, which is why the alphabet
 * behind it has no 0/O/1/I/L and why it is set in tabular figures at size. */
function JoinCode({ code }: { code: string }) {
  if (!code) return null;
  return (
    <p className={styles.joinCode}>
      <span className={styles.joinLabel}>Join code</span>
      <code className={styles.code}>{code}</code>
    </p>
  );
}

function CohortReport({ cohortId }: { cohortId: string }) {
  const { standing, loading, error } = useCohortProgress(cohortId);

  if (error) return <p className={styles.error}>{error}</p>;
  if (loading || !standing) return <p className={styles.muted}>Loading progress…</p>;

  if (standing.students === 0) {
    return (
      <p className={styles.muted}>
        Nobody in this class has answered a question yet. Share the join code above.
      </p>
    );
  }

  return (
    <>
      <p className={styles.summary}>
        {standing.students} {standing.students === 1 ? 'student' : 'students'} ·{' '}
        {standing.attempted} {standing.attempted === 1 ? 'answer' : 'answers'} recorded
      </p>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Weakest topics first. A module needs {MIN_STUDENTS} students before a score is shown, so
          that a class average can never be read back as one person&rsquo;s result.
        </caption>
        <thead>
          <tr>
            <th scope="col">Module</th>
            <th scope="col" className={styles.num}>Students</th>
            <th scope="col" className={styles.num}>Answers</th>
            <th scope="col" className={styles.num}>Correct</th>
          </tr>
        </thead>
        <tbody>
          {standing.modules.map((module) => (
            <Row key={module.moduleId} module={module} />
          ))}
        </tbody>
      </table>
    </>
  );
}

function Row({ module }: { module: ModuleStanding }) {
  const name = MODULE_NAMES.get(module.moduleId) ?? module.moduleId;
  return (
    <tr>
      <th scope="row" className={styles.rowHead}>
        <a href={`#${module.moduleId}`}>{name}</a>
      </th>
      <td className={styles.num}>{module.students}</td>
      <td className={styles.num}>{module.attempted}</td>
      <td className={styles.num}>
        {module.withheld ? (
          <span className={styles.withheld} title={`Fewer than ${MIN_STUDENTS} students`}>
            withheld
          </span>
        ) : (
          <span data-weak={module.percent !== null && module.percent < 60}>{module.percent}%</span>
        )}
      </td>
    </tr>
  );
}
