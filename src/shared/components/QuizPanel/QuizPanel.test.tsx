// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QuizPanel } from './QuizPanel';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary } from '@/shared/assessment/progressStore';
import type { PredictQuestion } from '@/shared/assessment/types';

afterEach(cleanup);

type Inputs = { dial: number };
type Preset = 'normal';
type Snapshot = { value: number };

const QUESTION: PredictQuestion<Inputs, Preset, Snapshot> = {
  id: 'q1',
  stem: 'A patient with something instructive going on.',
  setup: {},
  intervention: { label: 'You do the thing.', inputs: { dial: 9 } },
  prompt: 'What happens to the marker?',
  watch: 'the marker',
  correctDirection: 'rises',
  explanation: 'It rises because of the mechanism.',
  metric: (s) => s.value,
};

function makeSession(overrides: Partial<QuizSession<Inputs, Preset, Snapshot>> = {}) {
  return {
    phase: 'predicting',
    question: QUESTION,
    index: 1,
    total: 3,
    answer: null,
    correct: null,
    score: 0,
    start: vi.fn(),
    commit: vi.fn(),
    next: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  } as QuizSession<Inputs, Preset, Snapshot>;
}

const NO_HISTORY: ModuleSummary = { attempted: 0, correct: 0, lastOutcome: {} };

describe('QuizPanel', () => {
  it('offers to start when idle', () => {
    const session = makeSession({ phase: 'idle', question: null });
    render(<QuizPanel session={session} summary={NO_HISTORY} />);

    screen.getByRole('button', { name: 'Start practice' }).click();
    expect(session.start).toHaveBeenCalledOnce();
  });

  it('shows an all-time record only once something has been attempted', () => {
    render(<QuizPanel session={makeSession({ phase: 'idle', question: null })} summary={NO_HISTORY} />);
    expect(screen.queryByText(/all time/)).toBeNull();

    cleanup();
    render(
      <QuizPanel
        session={makeSession({ phase: 'idle', question: null })}
        summary={{ attempted: 4, correct: 3, lastOutcome: {} }}
      />,
    );
    expect(screen.getByText('3/4 all time')).toBeTruthy();
  });

  it('shows the stem and prompt while predicting', () => {
    render(<QuizPanel session={makeSession()} summary={NO_HISTORY} />);

    expect(screen.getByText(QUESTION.stem)).toBeTruthy();
    expect(screen.getByText(/What happens to the marker/)).toBeTruthy();
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
  });

  it('does NOT reveal the answer or explanation before commitment', () => {
    render(<QuizPanel session={makeSession()} summary={NO_HISTORY} />);

    // The whole method depends on the learner not being able to peek.
    expect(screen.queryByText(QUESTION.explanation)).toBeNull();
    expect(screen.queryByText(/Correct/)).toBeNull();
    expect(screen.queryByText(/Not quite/)).toBeNull();
  });

  it('offers all three directions, styled identically', () => {
    render(<QuizPanel session={makeSession()} summary={NO_HISTORY} />);

    const labels = ['Rises', 'Falls', 'Barely changes'];
    const classes = labels.map((label) => screen.getByRole('button', { name: label }).className);
    expect(new Set(classes).size).toBe(1);
  });

  it('commits the chosen direction', () => {
    const session = makeSession();
    render(<QuizPanel session={session} summary={NO_HISTORY} />);

    screen.getByRole('button', { name: 'Falls' }).click();
    expect(session.commit).toHaveBeenCalledWith('falls');
  });

  it('reveals the explanation and a correct verdict after a right answer', () => {
    render(
      <QuizPanel
        session={makeSession({ phase: 'revealed', answer: 'rises', correct: true, score: 1 })}
        summary={NO_HISTORY}
      />,
    );

    expect(screen.getByText(QUESTION.explanation)).toBeTruthy();
    expect(screen.getByText(/Correct/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rises' })).toBeNull();
  });

  it('names both the learner answer and the model answer after a wrong one', () => {
    render(
      <QuizPanel
        session={makeSession({ phase: 'revealed', answer: 'falls', correct: false, score: 0 })}
        summary={NO_HISTORY}
      />,
    );

    expect(screen.getByText(/Not quite/)).toBeTruthy();
    const detail = screen.getByText(/you said/).textContent ?? '';
    expect(detail).toContain('Falls');
    expect(detail).toContain('Rises');
    expect(screen.getByText(QUESTION.explanation)).toBeTruthy();
  });

  it('labels the last question Finish rather than Next', () => {
    render(
      <QuizPanel
        session={makeSession({ phase: 'revealed', answer: 'rises', correct: true, index: 3, total: 3 })}
        summary={NO_HISTORY}
      />,
    );
    expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
  });

  it('summarises the round when complete', () => {
    const session = makeSession({ phase: 'complete', question: null, score: 2, total: 3 });
    render(<QuizPanel session={session} summary={NO_HISTORY} />);

    expect(screen.getByText('2 of 3 correct')).toBeTruthy();
    screen.getByRole('button', { name: 'Again' }).click();
    expect(session.start).toHaveBeenCalledOnce();
  });
});
