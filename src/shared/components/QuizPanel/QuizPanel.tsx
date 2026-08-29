import { useEffect } from 'react';
import {
  DIRECTION_CHOICES,
  isPatternQuestion,
  orderedOptions,
  type Direction,
  type ModuleQuestion,
} from '@/shared/assessment/types';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary } from '@/shared/assessment/progressStore';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './QuizPanel.module.css';

interface QuizPanelProps<TInputs, TPreset extends string, TSnapshot> {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
  /** Display names for scenario options. Required for pattern-discrimination questions. */
  presetLabels?: Record<TPreset, string>;
}

function directionLabel(direction: string): string {
  return DIRECTION_CHOICES.find((choice) => choice.id === direction)?.label ?? direction;
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** The answer ids on offer, in display order. Scenario options are shuffled per question id;
 * directions are always the same three. */
function choiceIds<TInputs, TPreset extends string, TSnapshot>(
  question: ModuleQuestion<TInputs, TPreset, TSnapshot> | null,
): string[] {
  if (!question) return [];
  return isPatternQuestion<TInputs, TPreset, TSnapshot>(question)
    ? orderedOptions(question.id, question.options)
    : DIRECTION_CHOICES.map((choice: { id: Direction; label: string }) => choice.id);
}

/** Filled for answered, ringed for the current question, empty for the rest. Replaces a
 * "QUESTION 3 OF 8" line that was set in 11px caps and read as chrome rather than progress. */
function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <span className={styles.dots} aria-label={`Question ${index} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={styles.dot}
          data-state={i < index - 1 ? 'done' : i === index - 1 ? 'current' : 'todo'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Practice, sitting between the readouts and the charts so a question and the numbers that
 * answer it are on screen together.
 *
 * Two formats share this shell. In predict-then-run the learner commits before anything moves;
 * in pattern discrimination the scenario is already running with the controls hidden, and the
 * learner names it from the labs. Both depend on committing before the answer is visible.
 */
export function QuizPanel<TInputs, TPreset extends string, TSnapshot>({
  session,
  summary,
  presetLabels,
}: QuizPanelProps<TInputs, TPreset, TSnapshot>) {
  const { phase, question, index, total, answer, correct, score, mode, dueCount } = session;
  const { registerStartPractice } = useModuleShell();

  // Publish the start handler so the sticky header can offer a practice button. Withdrawn
  // while a session is running, which is what makes that button disappear.
  const idle = phase === 'idle' || phase === 'complete';
  const { start } = session;
  useEffect(() => {
    registerStartPractice(idle ? start : null);
    return () => registerStartPractice(null);
  }, [idle, start, registerStartPractice]);

  const choices = choiceIds<TInputs, TPreset, TSnapshot>(question);

  // Answer from the keyboard: 1-4 and A-D. A learner working through a set should not have to
  // move to the pointer for every question.
  const predicting = phase === 'predicting';
  const { commit } = session;
  useEffect(() => {
    if (!predicting || choices.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const key = event.key.toUpperCase();
      const byLetter = KEYS.indexOf(key);
      const byNumber = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
      const picked = choices[byLetter >= 0 ? byLetter : byNumber];
      if (picked === undefined) return;
      event.preventDefault();
      commit(picked);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [predicting, choices, commit]);

  if (phase === 'idle') {
    return (
      <div className={styles.panel}>
        <div className={styles.idleRow}>
          <div>
            <h2 className={styles.idleTitle}>Practice</h2>
            <p className={styles.idleBlurb}>
              {dueCount > 0
                ? `${dueCount} question${dueCount === 1 ? '' : 's'} ${dueCount === 1 ? 'is' : 'are'} due for review — the ones you have missed or not seen in a while.`
                : 'Commit to an answer, then find out whether the model agrees.'}
            </p>
          </div>
          <div className={styles.idleActions}>
            {summary.attempted > 0 && (
              <span className={styles.record}>
                {summary.correct}/{summary.attempted} all time
              </span>
            )}
            {/* Only offered when something is actually due — a review button that opens an
                empty session teaches the learner to ignore it. */}
            {dueCount > 0 && (
              <button type="button" className={styles.primary} onClick={session.startReview}>
                Review {dueCount}
              </button>
            )}
            <button
              type="button"
              className={dueCount > 0 ? styles.secondary : styles.primary}
              onClick={session.start}
            >
              {dueCount > 0 ? 'All questions' : 'Start practice'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className={styles.panel}>
        <div className={styles.idleRow}>
          <div>
            <h2 className={styles.idleTitle}>
              {score} of {total} correct
            </h2>
            <p className={styles.idleBlurb}>
              {score === total
                ? 'Every answer matched the model. Each one moves further down the queue.'
                : `${total - score} came back to the front of the queue — you will see ${total - score === 1 ? 'it' : 'them'} again shortly.`}
            </p>
          </div>
          <div className={styles.idleActions}>
            <button type="button" className={styles.secondary} onClick={session.exit}>
              Done
            </button>
            {dueCount > 0 ? (
              <button type="button" className={styles.primary} onClick={session.startReview}>
                Review {dueCount}
              </button>
            ) : (
              <button type="button" className={styles.primary} onClick={session.start}>
                Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const pattern = isPatternQuestion<TInputs, TPreset, TSnapshot>(question);
  const label = (id: string) => (pattern ? (presetLabels?.[id as TPreset] ?? id) : directionLabel(id));

  return (
    <section className={styles.live} aria-label="Practice question">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className="label">{mode === 'review' ? 'Review' : 'Practice'}</span>
          <ProgressDots index={index} total={total} />
        </div>
        <button type="button" className={styles.exit} onClick={session.exit}>
          Exit {mode === 'review' ? 'review' : 'practice'}
        </button>
      </header>

      <p className={styles.stem}>{question.stem}</p>

      {!pattern && (
        <p className={styles.prompt}>
          <strong>{question.intervention.label}</strong> {question.prompt}
        </p>
      )}
      {pattern && <p className={styles.prompt}>Which of these fits what you are seeing?</p>}

      {phase === 'predicting' && (
        <>
          {/* Choices are deliberately uniform — nothing here may hint at which one is right. */}
          <div className={styles.choices} role="group" aria-label={pattern ? 'Candidate scenarios' : question.prompt}>
            {choices.map((choice, i) => (
              <button key={choice} type="button" className={styles.choice} onClick={() => session.commit(choice)}>
                <span className={styles.key} aria-hidden="true">
                  {KEYS[i]}
                </span>
                <span className={styles.choiceLabel}>{label(choice)}</span>
              </button>
            ))}
          </div>
          <p className={styles.watch}>
            {pattern
              ? 'The controls are hidden — work from the readouts above.'
              : `Commit to an answer, then watch ${question.watch}.`}
          </p>
        </>
      )}

      {phase === 'revealed' && (
        <div className={styles.reveal} data-correct={correct}>
          <p className={styles.verdict}>
            <span className={styles.verdictTag}>{correct ? 'Correct' : 'Not quite'}</span>
            <span className={styles.verdictDetail}>
              {correct
                ? pattern
                  ? `this is ${label(answer ?? '')}.`
                  : `${question.watch} ${directionLabel(question.correctDirection).toLowerCase()}.`
                : `you said "${label(answer ?? '')}"; the model says "${label(
                    pattern ? question.answer : question.correctDirection,
                  )}".`}
            </span>
          </p>
          {/*
            The counterfactual is already on screen and unlabelled. `commit` freezes the trace
            BEFORE applying the intervention, so the dashed series is where the model was
            heading if nothing had been done — which is exactly what a learner who predicted
            "barely changes" needs to compare against. Naming it costs a line; leaving them to
            infer what a second series means wastes the one thing a video course cannot show.
          */}
          {!correct && !pattern && (
            <p className={styles.counterfactual}>
              The dashed trace is where {question.watch} was before the intervention — compare it
              with the live one to see the size of the change you predicted away.
            </p>
          )}
          <p className={styles.explanation}>{question.explanation}</p>
          <div className={styles.revealActions}>
            <span className={styles.record}>
              {score}/{index} this round
            </span>
            <button type="button" className={styles.primary} onClick={session.next}>
              {index === total ? 'Finish' : 'Next question'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
