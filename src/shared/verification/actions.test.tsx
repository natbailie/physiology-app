// @vitest-environment jsdom
import { createElement, type ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

afterEach(cleanup);

/**
 * Proves that the buttons in the sticky top bar do something — the half of "every control moves the
 * model" that `controls.test.tsx` cannot reach.
 *
 * That suite renders the ControlPanel, and the ControlPanel is not where these buttons live. A
 * module's scenarios and its one-off actions are passed to `PresetBar`, which `ModulePage` renders
 * in the top bar, so sixty-five action buttons across thirty-six modules were covered by nothing at
 * all — and no `*Page.tsx` in the repo was rendered by any test, so the wiring from a button through
 * `perturb` to the screen had never once been exercised. Twelve `perturbXxx` functions had no
 * reference anywhere outside their own definition and the page that calls them.
 *
 * The bug class here is WIRING, not engine logic: an action whose `perturb` is correct but whose
 * button is handed the wrong closure, or a scenario missing from the order the bar renders, fails in
 * exactly the way an engine test cannot see. So this renders the real page and presses the real
 * button, rather than calling `perturbXxx` directly.
 */

type Inputs = Record<string, unknown>;

const pageModules = import.meta.glob<Record<string, unknown>>('../../modules/*/*Page.tsx', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

/** The scenario map, found by shape: every module names it differently (`PRESETS`, `SHOCK_PRESETS`).
 * Same rule as `controls.test.tsx`, which discovers modules the same way and for the same reason. */
function findPresets(exports: Record<string, unknown>): Record<string, Inputs> | null {
  const entries = Object.entries(exports).filter(
    ([name, value]) => /PRESETS$/.test(name) && value && typeof value === 'object' && !Array.isArray(value),
  );
  const named = entries.find(([, value]) => Object.values(value as object).every((v) => v && typeof v === 'object'));
  return named ? (named[1] as Record<string, Inputs>) : null;
}

interface PageUnderTest {
  id: string;
  Page: ComponentType<Record<string, never>>;
  presetCount: number;
}

const pages: PageUnderTest[] = Object.entries(pageModules)
  .map(([path, exports]) => {
    const id = moduleIdOf(path);
    const Page = Object.entries(exports).find(([name, value]) => /Page$/.test(name) && typeof value === 'function')?.[1];
    const presets = findPresets(presetModules[`../../modules/${id}/engine/presets.ts`] ?? {});
    return { id, Page: Page as ComponentType<Record<string, never>>, presetCount: presets ? Object.keys(presets).length : 0 };
  })
  .filter((page) => Boolean(page.Page))
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Browser APIs `ModulePage` and its children reach for that jsdom does not implement.
 *
 * All three are layout, not physiology — the top bar measures itself, the explainer scrolls the lab
 * back into view, and the reduced-motion query decides whether that scroll animates. Stubbing them
 * is what lets a page render at all; none of them affects what this suite asserts.
 */
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((query: string) =>
    ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as unknown as MediaQueryList) as typeof window.matchMedia;
  window.scrollTo ??= (() => {}) as typeof window.scrollTo;
});

/**
 * Renders a module page and freezes it.
 *
 * The engine loop runs on `requestAnimationFrame`, which jsdom does drive — so an unpaused page
 * repaints between any two reads and EVERY comparison would report a change, whether the button did
 * anything or not. Pausing first is what makes a difference in the markup mean something.
 */
function openPaused(page: PageUnderTest): HTMLElement {
  const { container } = render(createElement(page.Page, {}));
  const pause = container.querySelector<HTMLButtonElement>('button[aria-label="Pause simulation"]');
  if (pause) fireEvent.click(pause);
  return container;
}

/**
 * Simulated time a comparison is allowed to run for, in presses of Step.
 *
 * Many of these actions are EVENTS rather than settings — a meal, a stimulus, a torch swung to the
 * other eye — and an event that has not been integrated yet is invisible by construction. CLAUDE.md
 * makes the point about this exact case: a fasting glucose model defends itself almost perfectly,
 * and it is the meal that separates a working pancreas from a failed one. So the press is judged on
 * where it leaves the model shortly afterwards, not on the instant it lands.
 */
const STEPS_AFTER_PRESS = 24;

/**
 * One run of the page: load a scenario or not, press one action or not, then advance.
 *
 * Comparing two runs is what makes this an experiment rather than an observation — Step moves the
 * charts on its own, so "the screen changed" is only evidence when the run that did NOT press the
 * button is measured the same way.
 */
function runWith(page: PageUnderTest, actionLabel: string | null, presetIndex: number | null, primeLabel?: string): string {
  const container = openPaused(page);
  const step = container.querySelector<HTMLButtonElement>('button[class*="step"]');
  const advance = () => {
    for (let i = 0; i < STEPS_AFTER_PRESS && step; i++) fireEvent.click(step);
  };
  const press = (label: string) => {
    const action = [...buttons(container, 'impulse'), ...buttons(container, 'danger')].find(
      (candidate) => candidate.textContent === label,
    );
    if (!action) throw new Error(`${page.id}: action "${label}" vanished between renders`);
    fireEvent.click(action);
  };
  if (presetIndex !== null) {
    const preset = buttons(container, 'preset')[presetIndex];
    if (preset) fireEvent.click(preset);
  }
  if (primeLabel) {
    press(primeLabel);
    advance();
  }
  if (actionLabel !== null) press(actionLabel);
  advance();
  const markup = screen(container);
  // Unmount before returning. `afterEach(cleanup)` is too late once a single test renders the page
  // hundreds of times — the preset-and-prime search below does exactly that, and holding every one
  // of those trees alive until the test ends exhausted the worker rather than failing an assertion.
  cleanup();
  return markup;
}

/**
 * Actions that are inert from every state this harness can construct, one verified reason each.
 *
 * This list is new, and it is not a relaxation: until `Term` stopped taking its tooltip id from
 * `useId`, that counter advanced on every render and no two runs of a page could ever compare
 * equal, so this check passed for every module carrying a defined readout label whether or not
 * the button did anything. These three are what it found once it could see.
 *
 * Two of them are a gap in the SEARCH rather than a dead button, and the gap is one dimension
 * wide: `actionReachesScreen` tries each scenario alone, and each priming action alone, but never
 * a scenario AND a prime together. Both were checked directly against the engine, and the
 * combination that works is named below — the fix is to search that product, and the reason it is
 * a comment rather than a loop is that doing so exhausts the worker's heap.
 */
const CONDITIONAL_ACTIONS = new Set<string>([
  // Divides histamine, which every scenario starts at zero because nothing has been given yet.
  // Priming with Challenge from the DEFAULTS does not help: the default patient is naive, and a
  // first exposure correctly releases no histamine. Verified to change the model in the
  // `typeIAnaphylaxis` and `treatedAnaphylaxis` scenarios once Challenge has been pressed.
  'hypersensitivity: "Adrenaline"',
  // Divides plasma volume excess, which is likewise zero until a unit has been given. Verified to
  // change the model in eleven of the thirteen scenarios once Transfuse has been pressed.
  'hypersensitivity: "Diurese"',
  // NOT a search gap. `perturbFeedNow` sets a let-down timer a few seconds long, and pregnancy
  // runs at a time scale measured in weeks — the pulse is over before the next frame is drawn,
  // in the app as much as in this test. Reaching the screen would mean giving the let-down a
  // visible decay rather than an instant one, which is engine work.
  'pregnancy: "Feed (let-down)"',
]);

/**
 * Whether an action reaches the screen from ANY state the module ships.
 *
 * Plenty of these are conditional by design and inert at rest — there is no abscess to drain on a
 * healthy patient, no duct to reopen once it has closed. Those are correct physiology, not dead
 * buttons, and the scenario that makes one matter is almost always one of the module's own presets.
 * `controls.test.tsx` judges conditional sliders the same way and for the same reason; the resting
 * patient is tried first because that is where a learner meets the button.
 */
function actionReachesScreen(page: PageUnderTest, label: string, siblings: string[]): boolean {
  for (let preset = -1; preset < page.presetCount; preset++) {
    const index = preset < 0 ? null : preset;
    if (runWith(page, label, index) !== runWith(page, null, index)) return true;
  }
  // Last resort: the state this action acts on may only exist once ANOTHER action has created it.
  // There is no abscess to drain until an insult has been deposited and has had time to collect,
  // and inflammation's own preset comments say as much — its scenarios are a host, waiting.
  if (siblings.some((prime) => prime !== label && runWith(page, label, null, prime) !== runWith(page, null, null, prime))) {
    return true;
  }

  return false;
}

/** CSS modules render as `_name_hash`, so an exact class selector matches nothing and the
 * assertion passes vacuously — which is worse than failing. See CLAUDE.md. */
const buttons = (container: HTMLElement, cls: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(`button[class*="${cls}"]`));

/** Everything a learner can see, minus the bar the buttons themselves live in — a pressed button
 * takes focus and its own markup changes, which would answer the question by itself. */
function screen(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[class*="topBar"]').forEach((bar) => bar.remove());
  return clone.innerHTML;
}

describe('every button in the top bar moves the model', () => {
  it('discovered every module page', () => {
    expect(pages.length).toBeGreaterThanOrEqual(45);
    expect(pages.filter((page) => page.presetCount === 0).map((page) => page.id)).toEqual([]);
  });

  describe.each(pages.map((page) => [page.id, page] as const))('%s', (id, page) => {
    it('renders a button for every scenario it ships', () => {
      // The gap this closes: `*_PRESET_ORDER` is a plain array, so tsc cannot check it covers the
      // presets map. A scenario left out of it has no button and is unreachable, while still
      // passing every test that reads the map directly.
      const container = openPaused(page);
      expect(buttons(container, 'preset').length, `${id}: scenario buttons vs presets in the map`).toBe(page.presetCount);
    });

    it('changes the screen when each action button is pressed', () => {
      const labels = [...buttons(openPaused(page), 'impulse'), ...buttons(openPaused(page), 'danger')].map(
        (action) => action.textContent ?? '',
      );
      if (labels.length === 0) return; // Nine modules ship scenarios only; there is nothing to press.
      const inert = labels
        .filter((label) => !actionReachesScreen(page, label, labels))
        .map((label) => `${id}: "${label}"`);
      const unexplained = inert.filter((entry) => !CONDITIONAL_ACTIONS.has(entry));
      const stale = [...CONDITIONAL_ACTIONS].filter((entry) => entry.startsWith(`${id}: `) && !inert.includes(entry));
      expect(
        { inert: unexplained, 'allowlisted but no longer inert — delete them': stale },
        `action buttons that change nothing on screen:\n  ${unexplained.join('\n  ') || '(none)'}`,
      ).toEqual({ inert: [], 'allowlisted but no longer inert — delete them': [] });
    });
  });
});
