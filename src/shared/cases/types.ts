import type { PanelField } from '@/shared/assessment/types';

/**
 * A patient: one scenario a module can already produce, given a name and a reason to care.
 *
 * The ward round is not a new kind of content. Every case here points at a preset the module
 * has had all along, and the questions it collects are the ones already written against it —
 * what a case adds is the history, the task and the payoff, which is the half a simulator
 * cannot infer. `shockStates`' haemorrhagic preset was documented as "a compensated Class III
 * bleed whose pressure still reads acceptable over a collapsed cardiac index" long before
 * anybody thought of the ward round; that sentence is a patient waiting for a name.
 *
 * Three rules hold this honest, and each is enforced rather than asked for:
 *
 * - **Observations are never written down.** `chart` is a list of ACCESSORS onto the settled
 *   simulation, the same `PanelField` rows the module's pattern questions are marked against.
 *   A case therefore cannot claim a MAP of 62 while the engine settles at 78, which is the one
 *   failure that would make the bedside a lie. `caseSuite.ts` reads the chart through the real
 *   engine and refuses a patient whose observations do not separate them from a healthy one.
 * - **Acuity is not authored.** How urgent a bed is depends on what THIS learner has forgotten,
 *   so it is derived from spaced-repetition state at render time — see `acuity.ts`. A hand-typed
 *   acuity would be stale the moment somebody answered a question.
 * - **A case adds no state.** Everything the round knows it reads from the progress store that
 *   already exists. There is no case table, no round record and no schema change.
 */
export interface ModuleCase<TPreset extends string, TSnapshot> {
  /** Globally unique across every module — it travels in the URL as `?case=<id>`. */
  id: string;
  name: string;
  age: number;
  /**
   * The bed this patient is in — `A04`, `B02`. Unique within the module; `caseSuite` asserts it.
   *
   * Authored rather than derived from the case id, and that is the point: a register of beds is
   * the thing the bedside banner imitates, and a pseudo-bed generated from a slug would be a lie
   * dressed as data. It is one token per case.
   */
  bed: string;
  /** One line on the board: the presenting complaint, not the diagnosis. Under 80 characters,
   * because it sits on a bed card beside an acuity chip. */
  oneLiner: string;
  /** The history, in the explainer's voice. What a colleague would tell you on the way to the
   * bed — enough to reason from, and deliberately not enough to answer from. */
  presentation: string;
  /** The scenario this patient IS. A name from the module's own `*_PRESETS`. */
  preset: TPreset;
  /** The bedside chart, read off the settled engine. Modules share one `*_PANEL` constant
   * between their pattern questions and their cases, so the rows a learner is examined on are
   * the rows they were shown. */
  chart: readonly PanelField<TSnapshot>[];
  /** What to work out at the bedside, in one sentence. Never the answer. */
  task: string;
  /** The payoff, 60-100 words, in the voice of a question explanation — which is the part of
   * this app that is actually the product. */
  teaching: string;
  /** This patient's questions, by id, within the owning module. Drives the bed's acuity and
   * the "see this patient" action.
   *
   * Deliberately module-scoped. A cross-module patient — the DKA bed wants respiratory AND
   * electrolyte questions — would have to be `{ moduleId, questionId }[]`, and the round board
   * could then no longer read one module's `schedule` directly. That is a real change, not a
   * wider type, so it waits for a case that genuinely needs it. */
  questionIds?: readonly string[];
}

/** A case with the module that owns it, which the round board needs and a case file should not
 * have to repeat. Supplied by the index from the manifest key, so the id cannot drift. */
export interface RoundCase {
  moduleId: string;
  id: string;
  name: string;
  age: number;
  oneLiner: string;
  questionIds: readonly string[];
}
