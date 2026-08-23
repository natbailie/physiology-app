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

/** The engine state carried inside a module's snapshot. Lets a question name a perturbation
 * without every module having to thread an extra generic. */
export type StateOf<TSnapshot> = TSnapshot extends { state: infer S } ? S : never;

export interface PredictQuestion<TInputs, TPreset extends string, TSnapshot> {
  id: string;
  /** Clinical framing, shown before the learner commits. */
  stem: string;
  /**
   * State established before the question is asked.
   *
   * `perturb` runs an event during setup — infecting a host, injuring a vessel, eating a meal.
   * Without it a question about an ongoing process would compare "nothing happening" against
   * "something happening", which is not a like-for-like before and after.
   */
  setup: {
    preset?: TPreset;
    inputs?: Partial<TInputs>;
    perturb?: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>;
  };
  /**
   * The intervention whose consequence is being predicted.
   *
   * `inputs` changes a setting. `perturb` applies a one-off event to the engine state — a meal,
   * a bolus, an injury, a stimulus. Many of the sharpest teaching moments in this app are
   * events rather than settings (a fasting model defends its glucose almost perfectly; it is
   * the meal that separates a working pancreas from a failed one), so a question may use
   * either or both.
   */
  intervention: {
    label: string;
    inputs?: Partial<TInputs>;
    perturb?: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>;
  };
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

/** One row of a lab panel, read off a settled simulation rather than hand-authored, so the
 * numbers a learner reasons about are always the ones the model actually produces. */
export interface PanelField<TSnapshot> {
  label: string;
  value: (snapshot: TSnapshot) => number;
  unit?: string;
  decimals?: number;
  /** Fractional difference below which two scenarios count as identical on this row. */
  tolerance?: number;
}

/**
 * Pattern-discrimination: the simulation is loaded with the answer scenario and the controls are
 * hidden, so the learner sees only the labs and has to say what is going on.
 *
 * This is the skill several modules were explicitly built to teach — the coagulation presets say
 * so in their own source comment — and it is the format closest to how these things are examined.
 */
export interface PatternQuestion<TPreset extends string, TSnapshot> {
  id: string;
  stem: string;
  /**
   * An event to run before the panel is read, for the same reason `PredictQuestion` has one:
   * in an event-driven module nothing happens until something is DONE to the patient.
   *
   * Without it every option settles at its own untouched baseline and the panels come out
   * identical, which the fairness check correctly rejects as unanswerable. A hypersensitivity
   * reaction has to be challenged, an infection has to be given — the scenario is not the
   * whole setup.
   */
  setup?: {
    perturb?: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>;
  };
  /** The scenario actually loaded. Also the correct answer. */
  answer: TPreset;
  /** Every option offered, including the answer. */
  options: readonly TPreset[];
  /** Rows the learner is expected to read, and what the fairness check compares. */
  panel: readonly PanelField<TSnapshot>[];
  explanation: string;
  settleSeconds?: number;
}

export type ModuleQuestion<TInputs, TPreset extends string, TSnapshot> =
  | PredictQuestion<TInputs, TPreset, TSnapshot>
  | PatternQuestion<TPreset, TSnapshot>;

export function isPatternQuestion<TInputs, TPreset extends string, TSnapshot>(
  question: ModuleQuestion<TInputs, TPreset, TSnapshot>,
): question is PatternQuestion<TPreset, TSnapshot> {
  return 'options' in question;
}

/** The answer id a commit is checked against, whichever format the question uses. */
export function correctAnswerOf<TInputs, TPreset extends string, TSnapshot>(
  question: ModuleQuestion<TInputs, TPreset, TSnapshot>,
): string {
  return isPatternQuestion(question) ? question.answer : question.correctDirection;
}

/** Stable string hash — used to order options without Math.random, so a question presents the
 * same way on every visit and in every test run. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Options in a fixed but non-obvious order, so the answer is not always in the same place. */
export function orderedOptions<TPreset extends string>(
  questionId: string,
  options: readonly TPreset[],
): TPreset[] {
  return [...options].sort((a, b) => hash(questionId + a) - hash(questionId + b));
}
