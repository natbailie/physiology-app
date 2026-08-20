import { DIRECTION_CHOICES, type Direction } from '@/shared/assessment/types';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary } from '@/shared/assessment/progressStore';
import styles from './QuizPanel.module.css';

interface QuizPanelProps<TInputs, TPreset extends string, TSnapshot> {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
}

function directionLabel(direction: Direction): string {
  return DIRECTION_CHOICES.find((choice) => choice.id === direction)?.label ?? direction;
}

/**
 * Predict-then-run practice, sitting between the readouts and the charts so the question and
 * the traces that answer it are visible at once.
 *
 * The learner commits before anything moves. That commitment is the mechanism: being wrong and
 * then watching why is a far stronger memory than being shown the right answer up front.
 */
export function QuizPanel<TInputs, TPreset extends string, TSnapshot>({
  session,
  summary,
}: QuizPanelProps<TInputs, TPreset, TSnapshot>) {
  const { phase, question, index, total, answer, correct, score } = session;

  if (phase === 'idle') {
    return (
      <div className={styles.panel}>
        <div className={styles.idleRow}>
          <div>
            <h2 className={styles.idleTitle}>Practice</h2>
            <p className={styles.idleBlurb}>
              Predict what the model will do, then watch whether you were right.
            </p>
          </div>
          <div className={styles.idleActions}>
            {summary.attempted > 0 && (
              <span className={styles.record}>
                {summary.correct}/{summary.attempted} all time
              </span>
            )}
            <button type="button" className={styles.primary} onClick={session.start}>
              Start practice
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
                ? 'Every prediction matched the model.'
                : 'The ones you missed are the ones worth coming back to.'}
            </p>
          </div>
          <div className={styles.idleActions}>
            <button type="button" className={styles.secondary} onClick={session.exit}>
              Done
            </button>
            <button type="button" className={styles.primary} onClick={session.start}>
              Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <section className={styles.panel} aria-label="Practice question">
      <header className={styles.header}>
        <span className="label">
          Question {index} of {total}
        </span>
        <button type="button" className={styles.exit} onClick={session.exit}>
          Exit practice
        </button>
      </header>

      <p className={styles.stem}>{question.stem}</p>

      <p className={styles.prompt}>
        <strong>{question.intervention.label}</strong> {question.prompt}
      </p>

      {phase === 'predicting' && (
        <>
          <div className={styles.choices} role="group" aria-label={question.prompt}>
            {DIRECTION_CHOICES.map((choice) => (
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
          <p className={styles.watch}>Commit to an answer, then watch {question.watch}.</p>
        </>
      )}

      {phase === 'revealed' && (
        <div className={styles.reveal} data-correct={correct}>
          <p className={styles.verdict}>
            {correct ? 'Correct — ' : 'Not quite — '}
            <span className={styles.verdictDetail}>
              {correct
                ? `${question.watch} ${directionLabel(question.correctDirection).toLowerCase()}.`
                : `you said "${directionLabel(answer!)}"; the model says "${directionLabel(
                    question.correctDirection,
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
