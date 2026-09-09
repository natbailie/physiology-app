/**
 * What the learner is looking at right now, for the tutor to read.
 *
 * The tutor already knows which module is open, what the app has written about it, and what the
 * learner keeps getting wrong. What it could not see until now is the screen: the numbers the
 * simulation is currently producing. Without them "why is my MAP falling?" can only be answered
 * in general terms, because the model has no idea what the MAP actually is.
 *
 * The readouts are not re-derived here. A module already declares its tiles as `ReadoutSpec`s and
 * `ReadoutGridView` already formats each one to the string on screen, so this stores the same
 * strings rather than a second opinion about them — the tutor and the tile cannot disagree.
 *
 * ## Why a module-level store rather than a context
 *
 * `ChatLauncher` mounts in `App.tsx` as a SIBLING of the routed page, not a descendant, so no
 * provider a module page could mount would reach it. This is the same shape as `progressStore`
 * and the `configuredFor` latch in both `revenuecat.ts` files: one process-wide slot, written by
 * whoever owns the screen, read by whoever needs it.
 *
 * ## Why a closure rather than a value
 *
 * The engine loop re-renders at frame rate. Storing the formatted lines on every frame would
 * spend real work sixty times a second on a question that is asked, at most, once a minute — so
 * what is stored is a FUNCTION that will compute them, and it is called only when a message is
 * actually sent. Publishing costs one assignment.
 *
 * Read with `readLiveState()`, which is a plain call and deliberately not a hook: nothing should
 * re-render because a number changed.
 */

import type { ReadoutContext, ReadoutSpec } from '@/shared/presentation/types';

export interface LiveReading {
  label: string;
  /** Already formatted by the module — the "42" of "42 mg/dL". */
  value: string;
  unit?: string;
  secondary?: string;
}

export interface LiveState {
  moduleId: string;
  readings: LiveReading[];
}

/** The screen currently on show, or null when the learner is not on a module page. */
let source: (() => LiveState) | null = null;

/**
 * Offer the current screen. Call from a committed effect rather than during render, so what is
 * stored is what a learner can actually see.
 */
export function publishLiveState(next: () => LiveState): void {
  source = next;
}

/**
 * Withdraw a screen on unmount.
 *
 * Takes the same function back and clears only if it is still the published one. React can mount
 * the next page before unmounting the last, and a clear that did not check would throw away the
 * arriving module's readings on the way out of the departing one.
 */
export function clearLiveState(owner: () => LiveState): void {
  if (source === owner) source = null;
}

/** The current screen, or null. Called once per sent message. */
export function readLiveState(): LiveState | null {
  return source === null ? null : source();
}

/**
 * The tiles a module is showing, as the tutor should see them.
 *
 * Shared rather than written once per platform, because the `blinded` filter below is a
 * correctness rule and not a rendering detail: the web grid and the phone's module screen have to
 * withhold the same tile, and two copies of that rule would eventually stop agreeing.
 *
 * Values come from `spec.value(ctx)` — the same call the tile itself makes — so what the tutor
 * reads is what the learner is reading, formatting and all.
 */
export function liveReadings<State, Derived, Inputs>(
  specs: readonly ReadoutSpec<State, Derived, Inputs>[],
  ctx: ReadoutContext<State, Derived, Inputs>,
  blinded: boolean,
): LiveReading[] {
  return specs
    // A tile that names the pattern goes blank on screen while a pattern question is unanswered.
    // It has to be withheld here too, or asking the tutor anything at all would hand over the
    // answer to the question the learner is in the middle of.
    .filter((spec) => !(spec.revealsPattern && blinded))
    .map((spec) => {
      const secondary = spec.secondary?.(ctx);
      return {
        label: spec.label,
        value: spec.value(ctx),
        ...(spec.unit ? { unit: spec.unit } : {}),
        ...(secondary ? { secondary } : {}),
      };
    });
}
