import { useCallback, useState } from 'react';
import { decodeScenario, encodeScenario, routeIdFromHash } from './scenarioUrl';

/**
 * A module's live inputs, seeded from a shared link when the URL carries one.
 *
 * Drops into the `useState(DEFAULT_INPUTS)` every module page already has, so adopting sharing
 * is a one-line change per page rather than a rewrite of twenty-six containers.
 *
 * The URL is read ONCE, at mount. It deliberately does not track the inputs afterwards: writing
 * to the address bar on every slider drag would flood the browser's history and make the back
 * button useless. Sharing is an explicit act, which is what `shareLink` is for.
 */
export function useShareableInputs<T extends object>(
  moduleId: string,
  defaults: T,
  /**
   * What to open on, when the page is not being opened cold.
   *
   * A ward-round case arrives at a patient, and settling normal physiology first — then jumping
   * to the bedside once an effect has run — shows the learner half a second of the wrong body.
   * Seeding here instead means `useEngineLoop` settles the patient directly, and because its
   * `settledState` is keyed on the inputs it caches that settle like any other.
   *
   * `defaults` still governs Share and Reset; this is the starting state, not a new baseline.
   * A scenario in the URL wins over it, because an explicit link is the more specific request.
   */
  initial?: T,
): {
  inputs: T;
  setInputs: React.Dispatch<React.SetStateAction<T>>;
  /** The URL that reproduces the current scenario. */
  shareLink: () => string;
} {
  const [inputs, setInputs] = useState<T>(() => {
    const opening = initial ?? defaults;
    if (typeof window === 'undefined') return opening;
    if (routeIdFromHash(window.location.hash) !== moduleId) return opening;

    const scenario = decodeScenario(window.location.hash);
    if (!scenario) return opening;

    // Only keys the module actually has. A link from an older version naming an input that no
    // longer exists loads the rest rather than failing, and a hand-edited one cannot inject
    // anything the module was not already expecting.
    const applied = { ...opening } as Record<string, unknown>;
    for (const [key, value] of Object.entries(scenario.inputs)) {
      if (key in applied && typeof value === typeof applied[key]) applied[key] = value;
    }
    return applied as T;
  });

  const shareLink = useCallback(() => {
    const hash = encodeScenario(moduleId, inputs, defaults);
    if (typeof window === 'undefined') return hash;
    return `${window.location.origin}${window.location.pathname}${hash}`;
  }, [moduleId, inputs, defaults]);

  return { inputs, setInputs, shareLink };
}
