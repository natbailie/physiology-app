import {
  DIRECTION_CHOICES,
  isPatternQuestion,
  orderedOptions,
  type Direction,
} from '@/shared/assessment/types';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary } from '@/shared/assessment/progressStore';
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
    <section className={styles.panel} aria-label="Practice question">
      <header className={styles.header}>
        <span className="label">
          {mode === 'review' ? 'Review' : 'Question'} {index} of {total}
        </span>
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
          <div
            className={pattern ? styles.options : styles.choices}
            role="group"
            aria-label={pattern ? 'Candidate scenarios' : question.prompt}
          >
            {pattern
              ? orderedOptions(question.id, question.options).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.choice}
                    onClick={() => session.commit(option)}
                  >
                    {presetLabels?.[option] ?? option}
                  </button>
                ))
              : DIRECTION_CHOICES.map((choice: { id: Direction; label: string }) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={styles.choice}
                    onClick={() => session.commit(choice.id)}
                  >
                    {choice.label}
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
            {correct ? 'Correct — ' : 'Not quite — '}
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
