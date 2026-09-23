import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** The `case` parameter of a module hash, or null. `#shockStates?case=amina-marathon`. */
export function caseIdFromHash(hash: string): string | null {
  const query = hash.indexOf('?');
  if (query === -1) return null;
  return new URLSearchParams(hash.slice(query + 1)).get('case');
}

/**
 * The hash that moves to a bed without leaving the page. Null clears to "all questions".
 *
 * Assigned with `location.hash = …`, never `history.pushState`: pushState fires no `hashchange`,
 * and `useModuleCase` and `useHashRoute` between them listen to nothing else — the URL would
 * change and the patient would not. Assignment also pushes a history entry, so Back walks the
 * round bed by bed.
 *
 * Every other parameter survives. A page opened from a share link carries `?s=<payload>`, and
 * although `useShareableInputs` reads that only once at mount, dropping it would leave an
 * address bar that no longer reproduces what is on screen.
 */
export function caseHref(hash: string, caseId: string | null): string {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const query = withoutHash.indexOf('?');
  const route = query === -1 ? withoutHash : withoutHash.slice(0, query);
  const params = new URLSearchParams(query === -1 ? '' : withoutHash.slice(query + 1));

  if (caseId) params.set('case', caseId);
  else params.delete('case');

  const rest = params.toString();
  return rest ? `#${route}?${rest}` : `#${route}`;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const currentHash = () => (typeof window === 'undefined' ? '' : window.location.hash);
const serverHash = () => '';

/**
 * The live `window.location.hash`.
 *
 * Exported so anything building a link off the current URL — the bed picker, which must keep a
 * shared `?s=` scenario alongside the bed it sets — re-renders when the hash moves. The route
 * cannot supply this: `useHashRoute` resolves every `?case=` of one module to the same id and
 * bails out, which is the whole reason this file owns a listener.
 */
export function useCurrentHash(): string {
  return useSyncExternalStore(subscribe, currentHash, serverHash);
}

/**
 * The patient this page was opened at, if it was opened from the ward round.
 *
 * **This hook listens to `hashchange` itself, and that is the whole reason it exists rather
 * than being a line inside the page.** `useHashRoute` resolves `#shockStates?case=amina` and
 * `#shockStates?case=george` to the same route id — which is correct, they are the same page —
 * so `setRoute` bails out, React does not re-render, and a learner pressing "next patient"
 * from inside a case would sit looking at the previous one. Reading the hash through
 * `useSyncExternalStore` means the case tracks the URL even when the route does not move.
 *
 * Returns null for a module opened from the catalogue, which is most of the time. Nothing about
 * a module page depends on a case existing.
 */
export function useModuleCase<TCase extends { id: string }>(
  cases: readonly TCase[],
): TCase | null {
  const hash = useCurrentHash();
  const id = caseIdFromHash(hash);
  return (id && cases.find((entry) => entry.id === id)) || null;
}

/**
 * Append `case=` to a share link, so a shared bedside stays a bedside.
 *
 * `encodeScenario` only knows about inputs, so a case shared from inside the ward round would
 * otherwise arrive as an anonymous set of slider positions — the physiology intact, the patient
 * gone, and with them the reason the numbers are worth looking at.
 */
export function withCase(link: string, caseId: string | null): string {
  if (!caseId) return link;
  return `${link}${link.includes('?') ? '&' : '?'}case=${encodeURIComponent(caseId)}`;
}

/** `useCallback`-stable wrapper pairing a module's `shareLink` with the active case. */
export function useCaseShareLink(shareLink: () => string, caseId: string | null): () => string {
  return useCallback(() => withCase(shareLink(), caseId), [shareLink, caseId]);
}

/**
 * The inputs a case opens on: module defaults with the patient's scenario laid over them.
 *
 * Built from DEFAULTS rather than from whatever is loaded, for the reason `useScenarioPreset`
 * documents at length — scenarios that compose from the current state stack silently.
 */
export function caseInputs<TInputs, TPreset extends string>(
  patient: { preset: TPreset } | null,
  defaults: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
): TInputs | undefined {
  if (!patient) return undefined;
  return { ...defaults, ...presets[patient.preset] };
}

export interface Bedside<TPreset extends string> {
  /** What is loaded now, so the banner can tell whether it is still the patient. */
  activePreset: TPreset | null;
  /** Drop-in replacement for the module's own preset applier. */
  apply: (name: TPreset) => void;
  /** Puts the patient back after the learner has explored elsewhere. */
  returnToBedside: () => void;
}

/**
 * Keeps track of which scenario is on screen, so a case banner can stop claiming a patient
 * whose physiology is no longer loaded.
 *
 * Preset-level only, deliberately. Nudging a slider is exploring WITHIN the patient — that is
 * the entire reason the bedside opens into a live simulator rather than a picture of one — and
 * a banner that went stale on the first drag would punish exactly the behaviour the ward round
 * exists to produce. Pressing "Septic" over Amina is a different act: it replaces her.
 */
export function useBedside<TPreset extends string>(
  patient: { id: string; preset: TPreset } | null,
  applyPreset: (name: TPreset) => void,
  /**
   * Run when the bed CHANGES or is CLEARED, just before the new one loads.
   *
   * A running quiz session has to end here. `useQuizSession` holds its queue as question IDS,
   * and changing the patient rebuilds the question list underneath it — after which the id at
   * the cursor resolves to nothing, `question` goes null, and QuizPanel renders empty while the
   * phase still says a question is open.
   */
  onBedChange?: () => void,
): Bedside<TPreset> {
  const [activePreset, setActivePreset] = useState<TPreset | null>(null);

  const apply = useCallback(
    (name: TPreset) => {
      setActivePreset(name);
      applyPreset(name);
    },
    [applyPreset],
  );

  /**
   * Loads the patient when the bed CHANGES under a page that is already mounted.
   *
   * `useShareableInputs` seeds from the case, but only in its `useState` initialiser — which
   * runs once. Walking the round from Amina to George moves the hash without changing the
   * route, so the page does not remount, the seed never runs again, and George's name appears
   * over Amina's physiology. The banner cannot catch that either: as far as it knows the loaded
   * scenario still matches the patient, because the patient is what changed.
   *
   * The ref starts at the bed the page mounted with, so the common path — a fresh load straight
   * into a case — does NOT re-apply and does not pay for a second settle.
   *
   * It tracks the CLEARED state too, and that is not tidiness. The guard used to bail on a null
   * patient without writing the ref, so Amina -> all questions -> Amina found a ref that still
   * said `amina-trauma`, matched it, and never re-applied her: her name over whatever the quiz
   * or the sliders had left, with `activePreset` unmoved so the stale banner could not tell
   * either. Clearing the bed does not reset the physiology — with no patient named, nothing is
   * being misattributed, and a learner who went to browse the whole module should not have
   * their exploration thrown away.
   */
  const loaded = useRef<string | null>(patient?.id ?? null);
  const changed = useRef(onBedChange);
  changed.current = onBedChange;

  useEffect(() => {
    const id = patient?.id ?? null;
    if (id === loaded.current) return;
    loaded.current = id;
    changed.current?.();
    if (patient) apply(patient.preset);
  }, [patient, apply]);

  const returnToBedside = useCallback(() => {
    if (patient) apply(patient.preset);
  }, [patient, apply]);

  return { activePreset, apply, returnToBedside };
}

/**
 * Puts the patient's physiology back once their questions are done.
 *
 * `useQuizSession.exit` restores no inputs — by the time a session ends the engine is sitting on
 * whatever scenario the last question established, which for a case is usually but not always
 * the patient's own. Nothing else notices: the quiz applies scenarios through
 * `useModulePractice`, so `useBedside.activePreset` never moves and the stale banner has nothing
 * to fire on. The learner switches back to the lab and works sliders labelled with a name that
 * is no longer what is loaded.
 *
 * Only on the transition INTO `complete`, and that is two deliberate restrictions:
 *
 * - A previous-phase ref, because an effect that merely reads `phase === 'idle'` fires at mount
 *   and re-applies the preset through an effect — the flicker and the second settle that
 *   `useShareableInputs`' third argument exists to avoid.
 * - Not on `exit`, because leaving a session early is usually deliberate: the learner has just
 *   been un-blinded and wants to look at what produced the panel. Resetting would take it away.
 */
export function useReturnToBedsideOnComplete(phase: string, returnToBedside: () => void): void {
  const previous = useRef(phase);
  useEffect(() => {
    const was = previous.current;
    previous.current = phase;
    if (phase === 'complete' && was !== 'complete') returnToBedside();
  }, [phase, returnToBedside]);
}
