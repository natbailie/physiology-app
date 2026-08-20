/** Which way a watched quantity moved. Constraining predictions to a direction is what
 * makes a question checkable against the engine that answers it — see `verifyQuestion`. */
export type Direction = 'rises' | 'falls' | 'unchanged';

export interface DirectionChoice {
  id: Direction;
  label: string;
}

export const DIRECTION_CHOICES: readonly DirectionChoice[] = [
  { id: 'rises', label: 'Rises' },
  { id: 'falls', label: 'Falls' },
  { id: 'unchanged', label: 'Barely changes' },
];

/** Fractional change below which a metric counts as having not really moved. */
export const DEFAULT_TOLERANCE = 0.05;

export interface PredictQuestion<TInputs, TPreset extends string, TSnapshot> {
  id: string;
  /** Clinical framing, shown before the learner commits. */
  stem: string;
  /** State established before the question is asked. */
  setup: { preset?: TPreset; inputs?: Partial<TInputs> };
  /** The intervention whose consequence is being predicted. */
  intervention: { label: string; inputs: Partial<TInputs> };
  /** The question itself, e.g. "What happens to PaCO2?" */
  prompt: string;
  /** Readout to watch while it plays out. */
  watch: string;
  correctDirection: Direction;
  /** Mechanism, revealed only after the learner has committed. */
  explanation: string;
  /** The quantity the prediction is about. Sampled before and after the intervention by
   * the verification harness, so the keyed answer cannot drift away from the engine. */
  metric: (snapshot: TSnapshot) => number;
  /** Simulated seconds to settle before asking, and to observe afterwards. */
  settleSeconds?: number;
  observeSeconds?: number;
  tolerance?: number;
}

export function directionOf(before: number, after: number, tolerance = DEFAULT_TOLERANCE): Direction {
  const scale = Math.max(Math.abs(before), 1e-9);
  const change = (after - before) / scale;
  if (change > tolerance) return 'rises';
  if (change < -tolerance) return 'falls';
  return 'unchanged';
}
