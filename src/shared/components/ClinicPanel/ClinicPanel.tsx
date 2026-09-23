import type { ReactNode } from 'react';
import { acuityOf, type Acuity } from '@/shared/cases/acuity';
import type { ModuleCase } from '@/shared/cases/types';
import type { ReviewState } from '@/shared/assessment/scheduling';
import { caseHref, useCurrentHash } from '@/shared/hooks/useModuleCase';
import text from '@/shared/styles/text.module.css';
import styles from './ClinicPanel.module.css';

/** The word on the chip. Colour is the second carrier here, never the only one. */
const ACUITY_LABEL: Record<Acuity, string> = {
  crash: 'CRASH',
  due: 'DUE',
  check: 'CHECK',
  newAdmission: 'NEW',
};

const ACUITY_CLASS: Record<Acuity, string> = {
  crash: styles.crash!,
  due: styles.due!,
  check: styles.check!,
  newAdmission: styles.newAdmission!,
};

export interface ClinicPanelProps<TPreset extends string, TSnapshot> {
  cases: readonly ModuleCase<TPreset, TSnapshot>[];
  /** The bed named in the hash, or null if none has been chosen yet. */
  patient: ModuleCase<TPreset, TSnapshot> | null;
  /** The live simulation. The chart is read from it every frame, so the observations are what
   * the engine is doing rather than what somebody typed when the case was written. */
  snapshot: TSnapshot | null;
  /** This module's review ladder, for the acuity chips. Derived, never authored — see acuity.ts. */
  schedule: Record<string, ReviewState>;
  /**
   * True while a question owns the engine.
   *
   * The chart then shows the QUESTION's scenario, which need not be this patient's, so it must
   * not be captioned with their name. Nothing else can tell: `useBedside.activePreset` only
   * moves when the preset bar is pressed, and the quiz applies scenarios through
   * `useModulePractice` instead — so without this the headline surface of the tab would assert
   * Amina's name over somebody else's numbers, directly above the options.
   */
  sessionActive: boolean;
  /** True once the learner has worked through this patient's questions. Gates the payoff. */
  sessionComplete: boolean;
  /** The QuizPanel. Passed as children so this component stays free of the inputs generic. */
  children: ReactNode;
}

/**
 * The Patients tab: who is in the bed, what happened to them, what their numbers are doing, and
 * the questions that make the connection.
 *
 * This is where `ModuleCase.presentation` and `ModuleCase.teaching` finally render. Both have
 * been authored on every patient and verified by `caseSuite.ts` since the cases landed, and
 * neither had anywhere to go while the patient was a strip in the page header.
 *
 * The order is the argument: history, then observations, then the questions, and only then the
 * payoff. `teaching` is the answer, so it stays off screen until the session is finished —
 * "never print the answer during practice" is the same rule the diagrams follow.
 */
export function ClinicPanel<TPreset extends string, TSnapshot>({
  cases,
  patient,
  snapshot,
  schedule,
  sessionActive,
  sessionComplete,
  children,
}: ClinicPanelProps<TPreset, TSnapshot>) {
  // Read here rather than passed in: the picker's hrefs have to carry whatever else is in the
  // URL, and this is the one subscription that re-renders when the hash moves.
  const hash = useCurrentHash();
  // Read once, not per row: a clock read in the render body re-evaluates every frame.
  const now = Date.now();

  return (
    <section className={styles.panel} aria-label="Patients">
      <div className={styles.picker}>
        {cases.map((entry) => {
          const acuity = acuityOf(schedule, entry.questionIds ?? [], now);
          return (
            <a
              key={entry.id}
              className={styles.bed}
              href={caseHref(hash, entry.id)}
              aria-pressed={entry.id === patient?.id}
            >
              <span className={`${styles.bedAcuity} ${ACUITY_CLASS[acuity]}`}>
                {ACUITY_LABEL[acuity]}
              </span>
              {entry.name}, {entry.age}
            </a>
          );
        })}
      </div>

      {patient && (
        <>
          <div className={styles.identity}>
            <h2 className={styles.who}>
              {patient.name}, {patient.age}
            </h2>
            <span className={styles.oneLiner}>{patient.oneLiner}</span>
          </div>
          <p className={styles.presentation}>{patient.presentation}</p>
        </>
      )}

      {snapshot && patient && (
        <>
          <div className={styles.chart}>
            {patient.chart.map((field) => (
              <div key={field.label} className={styles.row}>
                <span className={`${text.microLabel} ${styles.rowLabel}`}>{field.label}</span>
                <span className={styles.rowValue}>
                  {field.value(snapshot).toFixed(field.decimals ?? 1)}
                  {field.unit && <span className={styles.rowUnit}>{field.unit}</span>}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.chartCaption}>
            {sessionActive
              ? 'Observations for the scenario in front of you — not necessarily this patient.'
              : `${patient.name}'s observations, read live off the simulation.`}
          </p>
        </>
      )}

      {patient && !sessionActive && <p className={styles.task}>{patient.task}</p>}

      {patient ? (
        children
      ) : (
        <p className={styles.chartCaption}>
          Choose a patient to see their history, their observations and their questions.
        </p>
      )}

      {patient && sessionComplete && (
        <p className={styles.teaching}>
          <span className={`${text.kicker} ${styles.teachingLabel}`}>What this bed teaches</span>
          {patient.teaching}
        </p>
      )}
    </section>
  );
}
