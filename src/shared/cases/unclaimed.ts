/**
 * Which of a module's questions belong to a bed, and which do not.
 *
 * The Patients tab runs a patient's own questions; the Questions tab runs what is left. Those
 * leftovers are not an oversight — they are the questions whose scenario has no bed
 * (`wedge-separates-obstruction` wants a pulmonary embolism patient nobody has written) or
 * mechanism drills tied to no presentation at all (`altitude-paco2`, `contractility-and-gfr`).
 * A question can therefore be reached from exactly one tab, which is the property that makes
 * the split worth making.
 *
 * Pure, and deliberately so: no React, no DOM, no clock. It is copied into the native app
 * alongside the rest of `shared/cases`.
 */

/** Every question id some bed in this module names. */
export function claimedQuestionIds(
  cases: readonly { questionIds?: readonly string[] }[],
): ReadonlySet<string> {
  const claimed = new Set<string>();
  for (const entry of cases) {
    for (const id of entry.questionIds ?? []) claimed.add(id);
  }
  return claimed;
}

/**
 * The questions no bed collects, in authoring order.
 *
 * A structural parameter rather than `ModuleQuestion<TInputs, TPreset, TSnapshot>`: three type
 * arguments at every call site to read one `id`, and a value import of the assessment types into
 * a file the case layer owns.
 *
 * Call it at MODULE scope, not in a `useMemo` — `const SHOCK_UNCLAIMED = unclaimedQuestions(…)`
 * evaluates once when the chunk loads and keeps one identity forever, which is what
 * `useQuizSession` wants from a question array. A hook would recompute per mount for nothing.
 */
export function unclaimedQuestions<TQuestion extends { id: string }>(
  questions: readonly TQuestion[],
  cases: readonly { questionIds?: readonly string[] }[],
): readonly TQuestion[] {
  const claimed = claimedQuestionIds(cases);
  return questions.filter((question) => !claimed.has(question.id));
}
