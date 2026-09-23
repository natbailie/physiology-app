import type { ReactNode } from 'react';
import { dueQuestions, type ReviewState } from '@/shared/assessment/scheduling';
import { isPatternQuestion, type ModuleQuestion } from '@/shared/assessment/types';
import type { ModuleCase } from '@/shared/cases/types';
import { caseHref, useCurrentHash } from '@/shared/hooks/useModuleCase';
import text from '@/shared/styles/text.module.css';
import styles from './QuestionSet.module.css';

export interface QuestionSetProps<TInputs, TPreset extends string, TSnapshot> {
  /** How many questions this tab runs. */
  count: number;
  /** The module's beds, so work waiting at one can be pointed at. */
  beds: readonly ModuleCase<TPreset, TSnapshot>[];
  schedule: Record<string, ReviewState>;
  /** The live simulation the instrument reads. Null before the engine has produced one. */
  snapshot: TSnapshot | null;
  /** The session's current question. Null while no session is running, so idle and complete
   * states show the panel's own start/finish UI with no instrument above it. */
  question: ModuleQuestion<TInputs, TPreset, TSnapshot> | null;
  /** The QuizPanel, or null while another tab owns the session. */
  children: ReactNode;
}

/**
 * Display rounding for a predict metric, which — unlike a panel row — carries no decimals or
 * unit metadata. Two decimals with trailing zeros trimmed: MAP 62 reads "62", lactate 4.23
 * reads "4.23", and nothing pretends to a precision the question did not state.
 */
function formatMetric(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return String(Math.round(value * 100) / 100);
}

/**
 * The current question's own instrument, in the bedside chart idiom: panel rows for a pattern
 * question — the exact rows the fairness check marks against — and a single `metric` tile
 * labelled by `watch` for a predict one.
 *
 * One honest limit, stated once: `metric` takes a snapshot while `Sparkline` takes a
 * history-point accessor, so the dashed counterfactual trace cannot follow to this tab. The
 * learner gets the live number, not the movement.
 */
function QuestionInstrument<TInputs, TPreset extends string, TSnapshot>({
  question,
  snapshot,
}: {
  question: ModuleQuestion<TInputs, TPreset, TSnapshot>;
  snapshot: TSnapshot;
}) {
  if (isPatternQuestion<TInputs, TPreset, TSnapshot>(question)) {
    return (
      <>
        <div className={styles.chart} role="group" aria-label="Observations for this question">
          {question.panel.map((field) => (
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
          The panel this question is marked against, read live off the simulation — not typed by
          an author.
        </p>
      </>
    );
  }

  return (
    <>
      <div className={styles.chart} role="group" aria-label={`Live value of ${question.watch}`}>
        <div className={styles.row}>
          <span className={`${text.microLabel} ${styles.rowLabel}`}>{question.watch}</span>
          <span className={styles.rowValue}>{formatMetric(question.metric(snapshot))}</span>
        </div>
      </div>
      <p className={styles.chartCaption}>The live value — commit to an answer, then watch it move.</p>
    </>
  );
}

/**
 * The Questions tab: what the beds do not claim.
 *
 * These are not leftovers in the apologetic sense. They are the questions whose scenario has no
 * patient — shockStates asks about a pulmonary embolism nobody has written a bed for — and the
 * mechanism drills that belong to no presentation at all. A learner revising the mechanism
 * rather than the ward wants exactly this set, and putting it behind a patient would have been
 * the wrong door.
 *
 * It also carries the pointer to work waiting elsewhere. Splitting practice across beds means
 * `dueCount` is now scoped to whichever tab is showing, so a learner who followed a "Review
 * Shock States" link would otherwise land on a module whose due questions are all one tab over,
 * with nothing saying so.
 */
export function QuestionSet<TInputs, TPreset extends string, TSnapshot>({
  count,
  beds,
  schedule,
  snapshot,
  question,
  children,
}: QuestionSetProps<TInputs, TPreset, TSnapshot>) {
  const hash = useCurrentHash();
  const now = Date.now();

  const waiting = beds
    .map((bed) => ({ bed, due: dueQuestions(schedule, bed.questionIds ?? [], now).length }))
    .filter((entry) => entry.due > 0);

  return (
    <section className={styles.panel} aria-label="Questions">
      <div className={styles.head}>
        <h2 className={styles.title}>Questions</h2>
        <p className={styles.blurb}>
          {count === 1
            ? 'The one question in this module that belongs to no patient.'
            : `${count} questions that belong to no patient — the scenarios with no bed, and the mechanism drills.`}
        </p>
      </div>

      {/* Above the panel, never below it: the "work from the numbers above" line in QuizPanel
          is only true while this renders before the questions do. */}
      {snapshot && question ? <QuestionInstrument question={question} snapshot={snapshot} /> : null}

      {children}

      {waiting.length > 0 && (
        <p className={styles.elsewhere}>
          <span>
            Also due at the bedside:{' '}
            {waiting.map((entry, index) => (
              <span key={entry.bed.id}>
                {index > 0 && ', '}
                <a className={styles.bedLink} href={caseHref(hash, entry.bed.id)}>
                  {entry.bed.name} ({entry.due})
                </a>
              </span>
            ))}
            .
          </span>
        </p>
      )}
    </section>
  );
}
