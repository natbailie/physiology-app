// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QuizPanel } from './QuizPanel';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary } from '@/shared/assessment/progressStore';
import type { ModuleQuestion, PredictQuestion } from '@/shared/assessment/types';

afterEach(cleanup);

type Inputs = { dial: number };
type Preset = 'normal' | 'alpha' | 'beta';
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

const PATTERN: ModuleQuestion<Inputs, Preset, Snapshot> = {
  id: 'p1',
  stem: 'A patient whose panel points somewhere specific.',
  answer: 'normal',
  options: ['normal', 'alpha', 'beta'],
  panel: [
    { label: 'Marker', value: (s: Snapshot) => s.value },
    { label: 'Other', value: (s: Snapshot) => s.value },
    { label: 'Third', value: (s: Snapshot) => s.value },
  ],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const PRESET_LABELS = { normal: 'Normal', alpha: 'Alpha disease', beta: 'Beta disease' };

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

const NO_HISTORY: ModuleSummary = { attempted: 0, correct: 0, lastOutcome: {}, schedule: {} };

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
        summary={{ attempted: 4, correct: 3, lastOutcome: {}, schedule: {} }}
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

describe('QuizPanel — pattern discrimination', () => {
  it('offers every candidate scenario by its label', () => {
    render(
      <QuizPanel
        session={makeSession({ question: PATTERN })}
        summary={NO_HISTORY}
        presetLabels={PRESET_LABELS}
      />,
    );

    for (const label of ['Normal', 'Alpha disease', 'Beta disease']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('does not leak the answer or the explanation before commitment', () => {
    render(
      <QuizPanel
        session={makeSession({ question: PATTERN })}
        summary={NO_HISTORY}
        presetLabels={PRESET_LABELS}
      />,
    );

    expect(screen.queryByText(PATTERN.explanation)).toBeNull();
    expect(screen.queryByText(/Correct/)).toBeNull();
    // Every option must look identical — no styling tell.
    const classes = ['Normal', 'Alpha disease', 'Beta disease'].map(
      (label) => screen.getByRole('button', { name: label }).className,
    );
    expect(new Set(classes).size).toBe(1);
  });

  it('tells the learner the controls are hidden', () => {
    render(
      <QuizPanel
        session={makeSession({ question: PATTERN })}
        summary={NO_HISTORY}
        presetLabels={PRESET_LABELS}
      />,
    );
    expect(screen.getByText(/controls are hidden/i)).toBeTruthy();
  });

  it('commits the chosen scenario id, not its label', () => {
    const session = makeSession({ question: PATTERN });
    render(<QuizPanel session={session} summary={NO_HISTORY} presetLabels={PRESET_LABELS} />);

    screen.getByRole('button', { name: 'Alpha disease' }).click();
    expect(session.commit).toHaveBeenCalledWith('alpha');
  });

  it('names both scenarios in a wrong-answer verdict', () => {
    render(
      <QuizPanel
        session={makeSession({ question: PATTERN, phase: 'revealed', answer: 'alpha', correct: false })}
        summary={NO_HISTORY}
        presetLabels={PRESET_LABELS}
      />,
    );

    const detail = screen.getByText(/you said/).textContent ?? '';
    expect(detail).toContain('Alpha disease');
    expect(detail).toContain('Normal');
    expect(screen.getByText(PATTERN.explanation)).toBeTruthy();
  });
});

describe('explain-the-miss', () => {
  const wrongAnswer = {
    phase: 'revealed' as const,
    question: QUESTION,
    answer: 'falls',
    correct: false,
  };

  it('names the frozen baseline when the learner got it wrong', () => {
    // The counterfactual is already drawn; the learner just has no way to know what the second
    // series means.
    render(<QuizPanel session={makeSession(wrongAnswer)} summary={NO_HISTORY} />);
    expect(screen.getByText(/dashed trace/)).toBeTruthy();
  });

  it('stays quiet when they got it right', () => {
    render(
      <QuizPanel
        session={makeSession({ ...wrongAnswer, answer: 'rises', correct: true })}
        summary={NO_HISTORY}
      />,
    );
    expect(screen.queryByText(/dashed trace/)).toBeNull();
  });

  it('stays quiet for a pattern question, which has no intervention to compare against', () => {
    render(
      <QuizPanel
        session={makeSession({ phase: 'revealed', question: PATTERN, answer: 'normal', correct: false })}
        summary={NO_HISTORY}
        presetLabels={PRESET_LABELS}
      />,
    );
    expect(screen.queryByText(/dashed trace/)).toBeNull();
  });
});
