import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { DEFAULT_TOLERANCE, type PanelField, type PatternQuestion } from './types';

export interface PanelReading {
  label: string;
  value: number;
}

/** Integrate `seconds` of simulated time, respecting the engine's stability bound. */
function settle<TState, TInputs, TDerived, THistoryPoint>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  inputs: TInputs,
  seconds: number,
): { state: TState; derived: TDerived } {
  let current = config.createInitialState();
  let snapshot = { state: current, derived: config.computeDerived(current, inputs) };
  let remaining = seconds;

  while (remaining > 0) {
    const dt = Math.min(remaining, config.maxDtSeconds);
    remaining -= dt;
    snapshot = config.step(current, inputs, dt);
    current = snapshot.state;
  }

  return snapshot;
}

/** Settle one option and read the panel off it. */
export function readPanel<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  panel: readonly PanelField<{ state: TState; derived: TDerived }>[],
  preset: TPreset,
  seconds: number,
): PanelReading[] {
  const snapshot = settle(config, { ...defaultInputs, ...presets[preset] }, seconds);
  return panel.map((field) => ({ label: field.label, value: field.value(snapshot) }));
}

export interface PatternRunResult<TPreset extends string> {
  panels: Map<TPreset, PanelReading[]>;
  /** Distractors whose panel is indistinguishable from the answer's — an unfair question. */
  indistinguishable: TPreset[];
}

/**
 * Runs every option of a pattern question and checks the answer can actually be told apart.
 *
 * A pattern drill is only fair if the panel the learner is shown separates the answer from each
 * distractor. Two scenarios that produce the same numbers make the question unanswerable by
 * reasoning, which is worse than not asking it.
 */
export function runPatternQuestion<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  question: PatternQuestion<TPreset, { state: TState; derived: TDerived }>,
): PatternRunResult<TPreset> {
  const seconds = question.settleSeconds ?? 600;
  const panels = new Map<TPreset, PanelReading[]>();

  for (const option of question.options) {
    panels.set(option, readPanel(config, defaultInputs, presets, question.panel, option, seconds));
  }

  const answerPanel = panels.get(question.answer) ?? [];

  const indistinguishable = question.options
    .filter((option) => option !== question.answer)
    .filter((option) => {
      const other = panels.get(option) ?? [];
      return question.panel.every((field, index) => {
        const a = answerPanel[index]?.value ?? 0;
        const b = other[index]?.value ?? 0;
        const scale = Math.max(Math.abs(a), Math.abs(b), 1e-9);
        return Math.abs(a - b) / scale < (field.tolerance ?? DEFAULT_TOLERANCE);
      });
    });

  return { panels, indistinguishable };
}
