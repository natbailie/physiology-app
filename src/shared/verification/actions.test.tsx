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

/**
 * Every setting the control rail is currently showing.
 *
 * Range inputs are read by `aria-label` and value because `Slider` is CONTROLLED — its `value` is
 * the input the engine is running on — and toggle options by their pressed state, so a scenario
 * delivered as a categorical change is seen too. Scoped to the rail, which holds nothing but the
 * controls: the readouts and the diagram move on their own every frame and would answer the
 * question by themselves.
 */
function railSettings(container: HTMLElement): string {
  const rail = container.querySelector<HTMLElement>('[class*="railScroll"]');
  if (!rail) return '';
  const ranges = Array.from(rail.querySelectorAll<HTMLInputElement>('input[type="range"]')).map(
    (range) => `${range.getAttribute('aria-label')}=${range.value}`,
  );
  /* `aria-checked`, not `aria-pressed`: `ToggleGroup` renders a radio group, and its docblock says
   * the shared styling keys off `aria-checked` deliberately. Reading the wrong attribute made every
   * categorical control invisible to this check — which is how three torch buttons could write a
   * toggle and still be reported as leaving the rail untouched. */
  const toggles = Array.from(rail.querySelectorAll<HTMLButtonElement>('button[aria-checked]')).map(
    (option) => `${option.textContent}=${option.getAttribute('aria-checked')}`,
  );
  return [...ranges, ...toggles].join('|');
}

/**
 * Actions whose effect is an EVENT rather than a setting, one line of reason each.
 *
 * A stimulus, a manoeuvre, a bolus, a flash: the decay IS the physiology and there is nothing for a
 * slider to hold. Everything NOT named here is a standing change to the patient, and a standing
 * change has to leave the rail showing it — press "Haemorrhage 1 L" and the blood-volume slider
 * should walk down, because the alternative is a page whose controls disagree with its own picture
 * about what happened.
 *
 * That was the state of every one of these buttons: `perturb` writes engine STATE, which no slider
 * reads, so sixty-six buttons could move the model without moving the panel beside it. This list is
 * the half that is right to work that way, and it is asserted in BOTH directions, so a button
 * converted to an input edit has to come off it.
 */
const MOMENTARY_BY_DESIGN = new Set<string>([
  // Stimuli and manoeuvres: a depolarising pulse, a twitch, a tetanus, a forced expiration, a
  // positioning test, a head thrust, a flash. Each is over in milliseconds to seconds and the
  // RECOVERY is the reading — there is no standing quantity for a slider to hold.
  'membranePotentials: "Stimulate"',
  'muscleContraction: "Stimulate"',
  'neuromuscularJunction: "Tetanic burst"',
  'neuromuscularJunction: "Rest"',
  'respiratoryMechanics: "FVC maneuver"',
  'vestibular: "Dix-Hallpike"',
  'vestibular: "Head impulse"',
  'vision: "Camera flash"',
  'venousReturn: "Valsalva"',
  // Meals, boluses and doses: something given once that the body then handles. CLAUDE.md makes the
  // point about this exact class — a fasting glucose model defends itself almost perfectly, and it
  // is the meal that separates a working pancreas from a failed one. Where the SIZE of the dose is
  // a setting it already has its own slider, and that slider is what the button reads.
  'gastrointestinal: "Eat meal"',
  'digestionAbsorption: "Eat a meal"',
  'glucoseRegulation: "Eat meal"',
  'glucoseRegulation: "Give insulin"',
  'anteriorPituitary: "Oral glucose load"',
  'calciumHomeostasis: "Calcium infusion"',
  'electrolyteBalance: "Saline bolus"',
  'electrolyteBalance: "K+ bolus"',
  'somaticSensation: "Opioid bolus"',
  'motorControl: "Levodopa dose"',
  // Insults that arrive once and are then lived through: the wearing-off, the clearing, the
  // resolving is the teaching. A permanent version, where one exists, is already a slider beside
  // it — `noiseNotchDepthDb` carries the threshold shift a concert leaves behind for good.
  'adrenalMedulla: "Paroxysm"',
  'hpaAxis: "Acute stressor"',
  'coagulation: "Injure vessel"',
  'coronaryCirculation: "Vasospasm"',
  'erythropoiesis: "Acute bleed"',
  'exercisePhysiology: "Anaerobic surge"',
  'hearing: "Loud concert (no plugs)"',
  'liverPhysiology: "Haemolytic episode"',
  'liverPhysiology: "Alcohol binge"',
  'somaticSensation: "Fresh injury"',
  'pregnancy: "Feed (let-down)"',
  /* Labour onset starts a process that ENDS ITSELF: `engine.ts` clears `labourActive` the moment
   * dilation completes, and again on delivery. Same shape as Infect or New insult — an event that
   * begins something self-limiting — not a setting a slider could hold. The earlier reading, that
   * "once it starts it does not stop", is contradicted by the engine. */
  'pregnancy: "Labour onset"',
  // A host meeting an antigen, and the treatments for what follows. The preset sets up WHO the
  // patient is — sensitised, IgA deficient, ABO incompatible — and these buttons are the exposure
  // and its management, which is why `SAME_SCREEN_ON_PRESS_BY_DESIGN` records all 82 host pairs as
  // correctly identical until one of them is pressed.
  'hypersensitivity: "Challenge"',
  'hypersensitivity: "Transfuse"',
  'hypersensitivity: "Adrenaline"',
  'hypersensitivity: "Diurese"',
  'immuneResponse: "Infect"',
  'immuneResponse: "Vaccinate"',
  'inflammation: "New insult"',
  'inflammation: "Drain abscess"',
  // Treatments and insults the engine deliberately models as WEARING OFF, checked one by one
  // against their perturb bodies rather than against their names. Each writes a state field that
  // decays on a stated time constant, and the decay is the teaching: an antipyretic wears off, a
  // stent re-occludes as oedema reclaims it, a bronchospasm resolves, a bout of exertion ends, a
  // dose of insulin shifts potassium once. Converting these to standing inputs would not be making
  // the rail honest — it would be changing the physiology to match the rail.
  'liverPhysiology: "ERCP stent"',
  'thermoregulation: "Antipyretic"',
  'thermoregulation: "Active cooling"',
  'thermoregulation: "Active rewarming"',
  'respiratory: "Bronchospasm"',
  'coronaryCirculation: "Exertion"',
  'electrolyteBalance: "Give insulin"',
  'muscleContraction: "Caffeine"',
  'hptAxis: "Acute illness"',
  'anteriorPituitary: "Bromocriptine dose"',
  'capillaryExchange: "Albumin infusion"',
  // Volumes the model INTEGRATES rather than reads from a slider, so there is no control to move.
  // Cardiorenal's blood volume is the plant variable the kidney fills and empties, and cerebral
  // CSF accumulates at 0.35 mL/min; neither has a rail entry and neither should. Cardiorenal is
  // covered instead by making its baroreflex a control, so the bleed can be watched undefended.
  'cardiorenal: "Hemorrhage"',
  'cerebralPerfusion: "Drain CSF"',
]);

/**
 * Standing changes the rail does not yet show — the backlog, not an exemption.
 *
 * Each of these is a lasting change to the patient delivered through `perturb`, which writes engine
 * state no slider reads. Press "Haemorrhage 1 L" and the blood volume really does fall, but the
 * blood-volume slider beside it still reads 5000: the page tells the learner two different things
 * about the same patient, and only one of them is true.
 *
 * Each entry names the input the conversion should move. Asserted in both directions, so an entry
 * that has been converted fails until it is deleted.
 */
const STANDING_BUT_INVISIBLE = new Set<string>([
  // Empty, and it should stay that way. Every standing change now writes the inputs and shows on
  // the rail; a new button that writes engine state instead fails the check below until it is
  // either converted or explained on MOMENTARY_BY_DESIGN above.
]);

/**
 * Presses every action on ONE paused page and reports which of them left the rail unchanged.
 *
 * One render per module rather than one per button, which matters: this file already renders each
 * page hundreds of times for the screen sweep, and a second per-button sweep beside it exhausted
 * the worker's heap rather than failing an assertion. Pressing several actions onto the same page
 * is safe here because the rail is a pure function of the INPUTS — an earlier press can only have
 * moved a slider, and a later press that moves one still reads as a change.
 */
function actionsThatLeaveTheRail(page: PageUnderTest, labels: string[]): string[] {
  const container = openPaused(page);
  const actions = [...buttons(container, 'impulse'), ...buttons(container, 'danger')];
  const unmoved: string[] = [];
  for (const label of labels) {
    const action = actions.find((candidate) => candidate.textContent === label);
    if (!action) throw new Error(`${page.id}: action "${label}" vanished between renders`);
    const before = railSettings(container);
    fireEvent.click(action);
    if (railSettings(container) === before) unmoved.push(label);
  }
  cleanup();
  return unmoved;
}

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

    it('moves a control when a standing action is pressed', () => {
      // One render for the labels, and unmounted before the sweep starts. `afterEach(cleanup)` is
      // too late when a module has six buttons: the trees pile up inside the test and the worker
      // exits rather than failing an assertion, which is the trap the docblock above records.
      const opened = openPaused(page);
      const labels = [...buttons(opened, 'impulse'), ...buttons(opened, 'danger')].map(
        (action) => action.textContent ?? '',
      );
      cleanup();
      if (labels.length === 0) return; // Nine modules ship scenarios only; there is nothing to press.
      const invisible = actionsThatLeaveTheRail(page, labels).map((label) => `${id}: "${label}"`);
      const unexplained = invisible.filter(
        (entry) => !MOMENTARY_BY_DESIGN.has(entry) && !STANDING_BUT_INVISIBLE.has(entry),
      );
      const stale = [...MOMENTARY_BY_DESIGN, ...STANDING_BUT_INVISIBLE].filter(
        (entry) => entry.startsWith(`${id}: `) && !invisible.includes(entry),
      );
      expect(
        { 'standing actions the rail does not show': unexplained, 'allowlisted but now standing — delete them': stale },
        `action buttons that leave the control rail untouched:\n  ${unexplained.join('\n  ') || '(none)'}`,
      ).toEqual({ 'standing actions the rail does not show': [], 'allowlisted but now standing — delete them': [] });
    });
  });
});
