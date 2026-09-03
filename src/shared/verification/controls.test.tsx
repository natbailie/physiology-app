// @vitest-environment jsdom
import { createElement, type ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';

afterEach(cleanup);

/**
 * Proves that every control on every module actually does something.
 *
 * Nothing used to. The pattern-question suite checks only the presets an author happened to list
 * as a distractor, and the prediction suite only the inputs a question happens to move, so a
 * control could reach nothing at all and no test would notice — which is exactly what cardiorenal's
 * "High salt diet" did: it set `sodiumIntake`, which reached one derived field that neither the
 * readouts nor the diagram rendered, and pressing it changed nothing on screen.
 *
 * Modules, presets and controls are all DISCOVERED rather than listed, the way
 * `home/moduleQuestionIds.ts` discovers questions: a fifth hand-maintained list of module ids would
 * be the one that silently under-reports. Slider ranges are read off the rendered control panel
 * rather than duplicated here, so this measures the ranges a learner can actually reach.
 *
 * What this file does NOT reach is the sticky top bar: the scenario buttons and the one-off action
 * buttons live in `PresetBar`, not in the control panel, and are covered by `actions.test.tsx`.
 */

type AnyConfig = EngineLoopConfig<unknown, unknown, unknown, unknown>;
type Inputs = Record<string, unknown>;

const configModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });
const componentModules = import.meta.glob<Record<string, unknown>>('../../modules/*/components/*.tsx', { eager: true });
const pageSources = import.meta.glob<string>('../../modules/*/*Page.tsx', { eager: true, query: '?raw', import: 'default' });

const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

function findByShape<T>(exports: Record<string, unknown>, ok: (value: unknown) => boolean): T | null {
  for (const value of Object.values(exports)) if (ok(value)) return value as T;
  return null;
}

/** The scenario map, found by shape: every module names it differently (`PRESETS`,
 * `CARDIAC_PRESETS`, `SHOCK_PRESETS`). */
function findPresets(exports: Record<string, unknown>): Record<string, Inputs> | null {
  const entries = Object.entries(exports).filter(
    ([name, value]) => /PRESETS$/.test(name) && value && typeof value === 'object' && !Array.isArray(value),
  );
  const named = entries.find(([, value]) => Object.values(value as object).every((v) => v && typeof v === 'object'));
  return named ? (named[1] as Record<string, Inputs>) : null;
}

interface ModuleUnderTest {
  id: string;
  config: AnyConfig;
  defaults: Inputs;
  presets: Record<string, Inputs>;
  /** Everything `presets.ts` exports, so a block control can find the resolver behind it. */
  presetExports: Record<string, unknown>;
  /** Scenarios defined by elapsed time rather than by a setting; see `useScenarioPreset`. */
  settleOverrides: Record<string, number>;
  ControlPanel: ComponentType<Record<string, unknown>>;
  diagrams: ComponentType<Record<string, unknown>>[];
  /** Diagram plus readout tiles: everything a learner can actually see change. */
  visible: ComponentType<Record<string, unknown>>[];
}

/** The components a page puts in ModulePage's `diagram` slot, by name. Read from the page source
 * because the file names do not follow one convention — `CellCycleRing` and `ReactionCurveChart`
 * are diagrams too. */
function diagramNames(source: string): string[] {
  const start = source.indexOf('diagram={');
  if (start < 0) return [];
  let depth = 0;
  let end = start + 'diagram='.length;
  for (let i = end; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return [...new Set([...source.slice(start, end).matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]!))];
}

const modules: ModuleUnderTest[] = Object.entries(configModules).map(([path, exports]) => {
  const id = moduleIdOf(path);
  const config = findByShape<AnyConfig>(exports, (v) => !!v && typeof v === 'object' && 'step' in v && 'computeDerived' in v)!;
  const presetExports = presetModules[path.replace('loopConfig', 'presets')]!;
  const defaults = findByShape<Inputs>(
    Object.fromEntries(Object.entries(presetExports).filter(([name]) => /^DEFAULT_/.test(name))),
    (v) => !!v && typeof v === 'object' && !Array.isArray(v),
  )!;
  const presets = findPresets(presetExports)!;
  const settleOverrides =
    (Object.entries(presetExports).find(([name]) => /PRESET_SETTLE_SECONDS$/.test(name))?.[1] as Record<string, number>) ?? {};

  const components: Record<string, ComponentType<Record<string, unknown>>> = {};
  for (const [componentPath, exported] of Object.entries(componentModules)) {
    if (moduleIdOf(componentPath) !== id || componentPath.includes('.test.')) continue;
    for (const [name, value] of Object.entries(exported)) {
      if (typeof value === 'function' || (value && typeof value === 'object' && '$$typeof' in value)) {
        components[name] = value as ComponentType<Record<string, unknown>>;
      }
    }
  }
  const controlName = Object.keys(components).find((name) => /ControlPanel$/.test(name))!;
  const source = Object.entries(pageSources).find(([pagePath]) => moduleIdOf(pagePath) === id)![1];
  const diagrams = diagramNames(source)
    .map((name) => components[name])
    .filter((component): component is ComponentType<Record<string, unknown>> => Boolean(component));

  return {
    id,
    config,
    defaults,
    presets,
    presetExports,
    settleOverrides,
    ControlPanel: components[controlName]!,
    diagrams,
    visible: [
      ...diagrams,
      ...Object.entries(components)
        .filter(([name]) => /ReadoutPanel$/.test(name))
        .map(([, component]) => component),
    ],
  };
});

interface Settled {
  state: unknown;
  derived: unknown;
  /** Mean of every numeric reading over the sampling window. */
  mean: Record<string, number>;
  /** Lowest and highest each reading went in that window. Phase-insensitive, so an oscillator can
   * be compared against itself without the answer depending on where the cycle was caught. */
  low: Record<string, number>;
  high: Record<string, number>;
  /** Every classification string seen over that window, sorted. */
  labels: string;
}

/**
 * Chunked exactly as `useEngineLoop` settles and as `verifyQuestion` verifies, capped so a sweep of
 * every control on every module stays inside a test run rather than a coffee break.
 *
 * The comparison is a windowed MEAN, not the final instant. Half these modules are oscillators —
 * a cell cycle, a respiratory cycle, a cardiac cycle — and CLAUDE.md already records what sampling
 * one of those costs: a spindle poison and a replication block read identically at the instant the
 * sampled cell happens to be in G1, so two presets that arrest the cycle in different phases looked
 * like the same scenario.
 */
function settle(config: AnyConfig, inputs: unknown, seconds: number, stepCap: number, windowFraction = 0.2): Settled {
  let state = config.createInitialState();
  const dt = config.maxDtSeconds;
  const steps = Math.min(Math.ceil(seconds / dt), stepCap);
  const windowStart = Math.floor(steps * (1 - windowFraction));
  const every = Math.max(1, Math.floor((steps - windowStart) / 120));
  const samples: Record<string, number>[] = [];
  const seenLabels = new Set<string>();
  let derived = config.computeDerived(state, inputs);
  for (let i = 0; i < steps; i++) {
    const result = config.step(state, inputs, dt) as { state: unknown; derived: unknown };
    state = result.state;
    derived = result.derived;
    if (i >= windowStart && (i - windowStart) % every === 0) {
      samples.push(numbers(derived));
      seenLabels.add(labels(derived));
    }
  }
  if (!samples.length) {
    samples.push(numbers(derived));
    seenLabels.add(labels(derived));
  }
  const mean: Record<string, number> = {};
  const low: Record<string, number> = {};
  const high: Record<string, number> = {};
  for (const key of Object.keys(samples[0]!)) {
    const column = samples.map((row) => row[key] ?? 0);
    mean[key] = column.reduce((sum, v) => sum + v, 0) / column.length;
    low[key] = Math.min(...column);
    high[key] = Math.max(...column);
  }
  return { state, derived, mean, low, high, labels: [...seenLabels].sort().join('||') };
}

/** Steps a single settle may spend. `SWEEP_STEPS` is the quick pass every control gets;
 * `FULL_STEPS` is the retry a control gets before being called dead, and buys the longest run this
 * suite can afford — 200,000 of them across every control of every module is a coffee break. */
const SWEEP_STEPS = 2500;
const FULL_STEPS = 60_000;

function numbers(derived: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(derived as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v ? 1 : 0;
  }
  return out;
}
/** Strings in derived carry classifications ("hypovolaemic", "first-degree block") that a purely
 * numeric comparison would miss. */
function labels(derived: unknown): string {
  return Object.entries(derived as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}
function worstKey(a: Record<string, number>, b: Record<string, number>): string {
  let worst = '';
  let worstValue = -1;
  for (const key of Object.keys(a)) {
    const scale = Math.max(Math.abs(a[key]!), Math.abs(b[key] ?? 0), 1e-9);
    const diff = Math.abs(a[key]! - (b[key] ?? 0)) / scale;
    if (diff > worstValue) { worstValue = diff; worst = `${key} ${a[key]} -> ${b[key]}`; }
  }
  return worst;
}

function maxRelDiff(a: Record<string, number>, b: Record<string, number>, floor = 1e-9): number {
  let worst = 0;
  for (const key of Object.keys(a)) {
    const scale = Math.max(Math.abs(a[key]!), Math.abs(b[key] ?? 0), floor);
    worst = Math.max(worst, Math.abs(a[key]! - (b[key] ?? 0)) / scale);
  }
  return worst;
}
function differs(a: Settled, b: Settled, tolerance = 0.01): boolean {
  return maxRelDiff(a.mean, b.mean) > tolerance || a.labels !== b.labels;
}

interface Control {
  key: string;
  label: string;
  /**
   * Every setting the control can reach, in the order the panel offers them: the two ENDS of a
   * slider's range, and EVERY option of a toggle group.
   *
   * Toggles used to contribute their first and last option only. That exercised none of the middle
   * ones, and the middle is where the teaching lives — ten of ecgConduction's twelve leads, ten of
   * vision's twelve field-lesion sites and six of its eight rhythms were never once selected by
   * this suite.
   */
  values: unknown[];
  /**
   * Controls that replace a BLOCK of inputs rather than setting one key.
   *
   * capillaryExchange's tissue bed is the only one in the app: it calls back with a bed name and
   * the page splices in a whole `bedDefaults(bed)` patch, because a bed's pressures and reflection
   * coefficient are properties of the vessel wall rather than free choices.
   */
  patch?: (value: unknown) => Inputs;
}

/** The inputs a control asks for at one of its settings. */
function applied(background: Inputs, control: Control, value: unknown): Inputs {
  return control.patch ? { ...background, ...control.patch(value) } : { ...background, [control.key]: value };
}

/**
 * The resolver behind a block control, found by shape in the module's own `presets.ts` — an
 * exported function that turns one of the recorded option values into an input patch.
 *
 * Discovered rather than listed, like everything else here. A module that grows a second such
 * control gets swept with no edit to this file; a module whose resolver disappears fails loudly
 * instead of quietly dropping the control, which is exactly how the tissue bed came to be untested.
 */
function findBlockResolver(module: ModuleUnderTest, values: unknown[]): (value: unknown) => Inputs {
  for (const value of Object.values(module.presetExports)) {
    if (typeof value !== 'function' || value.length !== 1) continue;
    const resolve = value as (v: unknown) => unknown;
    try {
      const patches = values.map((v) => resolve(v));
      if (patches.every((p) => p && typeof p === 'object' && Object.keys(p).length > 0)) {
        return resolve as (v: unknown) => Inputs;
      }
    } catch {
      // Not this export; a resolver for a different value space throws or returns nothing useful.
    }
  }
  throw new Error(`${module.id}: a control asks for a block of inputs but presets.ts exports no resolver for it`);
}

/**
 * Every control the panel renders, with every setting it can reach — learnt by driving the real UI.
 *
 * Ranges live inside eight thousand lines of control-panel JSX and nowhere else. Reading them off
 * the rendered inputs keeps this honest: it tests the range a learner can actually reach, and it
 * cannot drift out of date the way a duplicated table would.
 *
 * The panel is rendered ONCE PER TOGGLE SETTING, not once, because a panel may render different
 * sliders for different settings. hpgAxis is the only one that does — it offers exogenous estrogen
 * to a female patient and exogenous testosterone to a male one — and rendering only the default
 * (female) panel hid `exogenousTestosterone` completely, despite `anabolicSteroidUse` being a
 * shipped scenario that sets it.
 */
function discoverControls(module: ModuleUnderTest): Control[] {
  const found = new Map<string, Control>();
  const collect = (inputs: Inputs) => {
    for (const control of controlsInPanel(module, inputs)) if (!found.has(control.key)) found.set(control.key, control);
  };
  collect(module.defaults);
  for (const control of [...found.values()]) {
    if (control.values.length <= 2 && typeof control.values[0] === 'number') continue; // A slider reveals nothing.
    for (const value of control.values) collect(applied(module.defaults, control, value));
  }
  return [...found.values()];
}

function controlsInPanel(module: ModuleUnderTest, inputs: Inputs): Control[] {
  const calls: unknown[][] = [];
  // The raw arguments, not a normalised pair: a control wired straight to a ToggleGroup may call
  // back with ONE argument — a selection rather than an input change — and the old recorder
  // discarded those, which is why capillaryExchange's four tissue beds were never swept.
  const record = (...args: unknown[]) => {
    calls.push(args);
  };
  const { container } = render(
    createElement(
      ModuleShellProvider as ComponentType<{ blinded: boolean }>,
      { blinded: false },
      createElement(module.ControlPanel, { inputs, onChange: record, onSelectBed: record }),
    ),
  );

  const controls: Control[] = [];
  for (const input of Array.from(container.querySelectorAll<HTMLInputElement>('input[type="range"]'))) {
    const label = input.getAttribute('aria-label') ?? '(unlabelled)';
    const min = Number(input.min);
    const max = Number(input.max);
    // Probed at whichever end the slider is NOT already sitting on: React fires no change event
    // for a value identical to the one it just rendered, which silently hid every control on a
    // module whose defaults sit at the bottom of the range.
    calls.length = 0;
    fireEvent.change(input, { target: { value: String(Number(input.value) === min ? max : min) } });
    if (calls.length !== 1 || calls[0]!.length !== 2 || typeof calls[0]![0] !== 'string') continue;
    controls.push({ key: calls[0]![0], label, values: [min, max] });
  }

  // Toggle groups announce themselves as radiogroups, which is a firmer handle than "a button that
  // happened to call back exactly once" — and it is what finds a one-argument selection at all.
  for (const group of Array.from(container.querySelectorAll('[role="radiogroup"]'))) {
    const label = group.getAttribute('aria-label') ?? '(unlabelled)';
    const values: unknown[] = [];
    let key: string | null = null;
    let isBlock = false;
    for (const option of Array.from(group.querySelectorAll('button'))) {
      calls.length = 0;
      fireEvent.click(option);
      if (calls.length !== 1) continue;
      const args = calls[0]!;
      const value = args.length === 2 && typeof args[0] === 'string' ? ((key = args[0]), args[1]) : ((isBlock = true), args[0]);
      if (!values.some((v) => Object.is(v, value))) values.push(value);
    }
    if (values.length < 2) continue;
    if (isBlock) {
      const resolve = findBlockResolver(module, values);
      // Named after the input the patch itself carries, so an allowlist entry reads the same way as
      // one for any other control.
      const patch = resolve(values[0]);
      const carried = Object.keys(patch).find((k) => Object.is(patch[k], values[0]));
      controls.push({ key: carried ?? label, label: `${label} (toggle)`, values, patch: resolve });
    } else {
      controls.push({ key: key!, label: `${label} (toggle)`, values });
    }
  }
  cleanup();
  return controls;
}

/**
 * Backgrounds a control is swept against: the module's calibrated defaults first, then every
 * scenario it ships.
 *
 * Plenty of controls are conditional by design and inert at rest — humidity does nothing until the
 * patient is sweating, an inhibitor constant does nothing with no inhibitor present, an infarct
 * territory does nothing with no infarct. Those are correct physiology, not dead controls, and the
 * scenario that makes them matter is almost always one of the module's own presets.
 */
function backgrounds(module: ModuleUnderTest): Inputs[] {
  return [module.defaults, ...Object.values(module.presets).map((preset) => ({ ...module.defaults, ...preset }))];
}

function sweepChangesReadings(module: ModuleUnderTest, control: Control): boolean {
  // What the page shows on release, then the longest run the step budget can buy — some effects
  // (a bladder filling, a runner drying out) are real but need hours of simulated time.
  const horizons: [number, number][] = [
    [module.config.settleSeconds ?? 60, SWEEP_STEPS],
    [FULL_STEPS * module.config.maxDtSeconds, FULL_STEPS],
  ];
  for (const [seconds, cap] of horizons) {
    for (const background of backgrounds(module)) {
      const first = settle(module.config, applied(background, control, control.values[0]), seconds, cap);
      // Any setting reaching a different reading is enough for the control to be alive. Whether the
      // settings are distinct FROM EACH OTHER is a sharper question, asked separately below.
      for (const value of control.values.slice(1)) {
        if (differs(first, settle(module.config, applied(background, control, value), seconds, cap))) return true;
      }
    }
  }
  return false;
}

/**
 * Compares an allowlist against what the sweep actually finds, in BOTH directions.
 *
 * Each of the three lists below is a backlog with a reason per line, and a plain `filter`-then-
 * expect-empty leaves them one-way: an entry whose diagram has since gained the correlate, or a
 * control that has since come alive, stays on the list silently and the backlog only ever grows.
 * Asserting set equality means the list has to be maintained down as well as up.
 */
function expectExactly(actual: string[], allowed: string[], what: string) {
  const added = actual.filter((entry) => !allowed.includes(entry)).sort();
  const fixed = allowed.filter((entry) => !actual.includes(entry)).sort();
  expect(
    { [what]: added, 'entries that are no longer needed — delete them from the allowlist': fixed },
    `${what}:\n  ${added.join('\n  ') || '(none)'}\nallowlisted but no longer true:\n  ${fixed.join('\n  ') || '(none)'}`,
  ).toEqual({ [what]: [], 'entries that are no longer needed — delete them from the allowlist': [] });
}

/**
 * Controls the diagram does not show — the outstanding half of CLAUDE.md's "every control needs a
 * visible correlate".
 *
 * This is a BACKLOG, not a set of exemptions. Each entry is a slider that moves the numbers and
 * leaves the picture untouched, which is the drift CLAUDE.md already names as the thing that went
 * furthest wrong in this app. Fourteen diagrams are involved; four of them (coagulation, immune
 * response, hypersensitivity, inflammation) show none of their controls at all, because each draws
 * a fixed cascade with the readings living entirely in the readout tiles beside it.
 *
 * The list is declared here so it can be read and worked off rather than growing in silence, and it
 * is asserted in BOTH directions — an entry whose diagram has since gained the correlate fails
 * until it is deleted. That is not hypothetical: `calciumHomeostasis.dietaryPhosphateIntake` was
 * the first entry the two-way check retired.
 */
const NO_DIAGRAM_CORRELATE = new Set<string>([
  // Fixed cascade drawings: the whole control rail feeds tiles, not the picture.
  ...['factorVIIIActivity', 'factorIXActivity', 'vitaminKDependentFactors', 'vonWillebrandFactor', 'plateletCount', 'fibrinogenLevel', 'heparinDose', 'aspirinDose', 'fibrinolyticActivity'].map((k) => `coagulation.${k}`),
  ...['pathogenVirulence', 'innateImmuneFunction', 'helperTCellCount', 'bCellFunction', 'immunosuppression', 'pathogenType'].map((k) => `immuneResponse.${k}`),
  ...['antigenDose', 'igeSensitisation', 'iggAgainstCellSurface', 'circulatingIggForComplexes', 'sensitisedTCells', 'complementFunction', 'mastCellStabilisation', 'aboCompatibility', 'recipientIgaDeficiency', 'productLeukocyteLoad', 'donorAntileukocyteAntibody', 'anamnesticRecall', 'cardiacReserve'].map((k) => `hypersensitivity.${k}`),
  ...['insultSeverityPct', 'antibioticEfficacyPct', 'sourceControlPct'].map((k) => `inflammation.${k}`),
  // The nephron schematic draws flow and transport, not the drugs and tones acting on them.
  ...['acetazolamideDose', 'enacBlockade', 'aldosteroneTone', 'distalAcidSecretion', 'proximalAcidReclaim'].map((k) => `renalTubular.${k}`),
  // Single quantities the drawing has no structure for yet.
  'digestionAbsorption.mealLactoseGrams',
  'gastrointestinal.mealFatGrams',
  'gastrointestinal.mealCarbGrams',
  'fetalCirculation.prostaglandinLevel',
  'liverPhysiology.albuminGPerL',
  'muscleContraction.extracellularCalcium',
  'micturition.cortexInhibitsMicturition',
  // Cell-cycle controls act over whole 24-hour cycles; see the readings note below.
  ...['dnaDamage', 'p53Function', 'spindlePoisonPct', 'replicationBlockPct'].map((k) => `cellCycle.${k}`),
  // Delivered as events, not settings; see the readings note below.
  'glucoseRegulation.mealCarbLoadGrams',
  'glucoseRegulation.exogenousInsulinUnits',
]);

/**
 * Controls that are real but cannot be demonstrated by a settle-and-compare sweep, with the reason
 * and where they ARE covered.
 */
const NOT_SWEEPABLE = new Set<string>([
  // A taxane arrests cells in M and hydroxyurea in S, so both need the population to REACH those
  // phases: several 24-hour cycles, which at this module's dt is millions of steps. Covered
  // directly by `cellCycle/engine/engine.test.ts`, which sweeps spindlePoisonPct itself.
  'cellCycle.spindlePoisonPct',
  'cellCycle.replicationBlockPct',
  // Queued rather than applied: both are delivered by the "Eat meal" and "Give insulin" actions.
  // CLAUDE.md makes the point — a fasting glucose model defends itself almost perfectly, and it is
  // the meal that separates a working pancreas from a failed one.
  'glucoseRegulation.mealCarbLoadGrams',
  'glucoseRegulation.exogenousInsulinUnits',
]);

/**
 * Toggle options that genuinely read alike, one line of reason each.
 *
 * Populated from what the sweep actually finds. Like the lists above it is asserted in both
 * directions, so an option that gains a reading of its own has to be taken off.
 */
const TOGGLE_OPTION_TIES_BY_DESIGN = new Set<string>([]);

/**
 * Two scenarios that draw the same screen AT THE MOMENT THEY ARE PRESSED, one line of reason each.
 *
 * This is a different question from the one below, and keeping them on one list was hiding an
 * answer. A host module's scenarios are a patient waiting for an event — the preset comments say so
 * themselves, "hit Infect", "deposit an insult" — so on press the drawing is identical and correct.
 * They no longer settle alike, which is why they have come OFF the collisions list and stayed on
 * this one.
 */
const SAME_SCREEN_ON_PRESS_BY_DESIGN = new Set<string>([
  // Two modules whose scenarios are a HOST, waiting for an event. Nothing has happened yet when the
  // button is pressed, so the drawing is rightly identical; the host differences appear the moment
  // an infection or an insult lands, and they now show up in the settle test below.
  ...['healthyHost==intracellularPathogen','healthyHost==neutropenia','healthyHost==hivCd4Depletion','healthyHost==bCellDeficiency','healthyHost==transplantImmunosuppression','intracellularPathogen==neutropenia','intracellularPathogen==hivCd4Depletion','intracellularPathogen==bCellDeficiency','intracellularPathogen==transplantImmunosuppression','neutropenia==hivCd4Depletion','neutropenia==bCellDeficiency','neutropenia==transplantImmunosuppression','hivCd4Depletion==bCellDeficiency','hivCd4Depletion==transplantImmunosuppression','bCellDeficiency==transplantImmunosuppression'].map((pair) => `immuneResponse.${pair}`),
  ...['normal==acuteCellulitis','normal==severeBacterialLoad','normal==steroidsOverInfection','acuteCellulitis==severeBacterialLoad','acuteCellulitis==steroidsOverInfection','severeBacterialLoad==steroidsOverInfection'].map((pair) => `inflammation.${pair}`),
  // The meal and the insulin are events, not settings: a fasting pancreas and a failed one look the
  // same until something is eaten.
  'glucoseRegulation.normal==fasting',
  'glucoseRegulation.normal==insulinOverdose',
  'glucoseRegulation.fasting==insulinOverdose',
  // A cell population takes whole 24-hour cycles to reach the phase an arrest acts in, and an
  // irradiated cell and a p53-null one are both undamaged at time zero.
  'cellCycle.normal==taxaneArrest',
  'cellCycle.normal==hydroxyurea',
  'cellCycle.taxaneArrest==hydroxyurea',
  'cellCycle.irradiated==tp53Mutated',
]);

/** Two scenarios that genuinely settle to the same physiology, one line of reason each. */
const PRESET_COLLISIONS_BY_DESIGN = new Set<string>([
  // Both are the absence of a reaction, which is the teaching: a compatible transfusion is a
  // non-event, and so is a first exposure to an antigen you have never met.
  'hypersensitivity.naiveFirstExposure==compatibleTransfusion',
  // Same three scenarios, same reason as the controls above: the meal and the insulin are events.
  'glucoseRegulation.normal==fasting',
  'glucoseRegulation.normal==insulinOverdose',
  'glucoseRegulation.fasting==insulinOverdose',
  // Arrest presets need whole cell cycles to separate; covered by the module's own engine tests.
  'cellCycle.normal==taxaneArrest',
  'cellCycle.normal==hydroxyurea',
  'cellCycle.taxaneArrest==hydroxyurea',
]);

/** Renders the given components against a settled scenario and returns their markup. Everything a
 * learner can see is either in the diagram or in the readout tiles, so comparing this markup is
 * the closest a test gets to asking "did the screen change?". */
function paint(components: ComponentType<Record<string, unknown>>[], inputs: Inputs, settled: Settled): string {
  const props = { derived: settled.derived, inputs, state: settled.state, history: [], baselineHistory: null, excitationPulse: 0 };
  const { container } = render(
    createElement(
      ModuleShellProvider as ComponentType<{ blinded: boolean }>,
      { blinded: false },
      ...components.map((Component, index) => createElement(Component, { ...props, key: index })),
    ),
  );
  const html = container.innerHTML;
  cleanup();
  return html;
}

/** A scenario as the page shows it on press, and as it looks after the longest run the budget
 * allows — a preset only counts as dead if it is indistinguishable at both. */
function scenarioAt(module: ModuleUnderTest, name: string, long: boolean): Settled {
  const inputs = { ...module.defaults, ...module.presets[name] };
  const shown = (module.config.settleSeconds ?? 0) + (module.settleOverrides[name] ?? 0);
  return long
    ? settle(module.config, inputs, FULL_STEPS * module.config.maxDtSeconds, FULL_STEPS)
    : settle(module.config, inputs, shown, FULL_STEPS);
}

describe('every control moves the model', () => {
  it('discovered every module', () => {
    expect(modules.length).toBeGreaterThanOrEqual(45);
    expect(modules.filter((m) => !m.ControlPanel || !m.presets || !m.defaults).map((m) => m.id)).toEqual([]);
    expect(modules.filter((m) => m.diagrams.length === 0).map((m) => m.id)).toEqual([]);
  });

  describe.each(modules.map((m) => [m.id, m] as const))('%s', (id, module) => {
    const controls = discoverControls(module);

    it('renders at least one control', () => {
      expect(controls.length).toBeGreaterThan(0);
    });

    it('changes a reading when each control is swept across its range', () => {
      const inert = controls.filter((control) => !sweepChangesReadings(module, control)).map((control) => `${id}.${control.key}`);
      expectExactly(inert, [...NOT_SWEEPABLE].filter((entry) => entry.startsWith(`${id}.`)), `${id}: controls that change no reading`);
    });

    it('changes the diagram when each control is swept across its range', () => {
      const seconds = module.config.settleSeconds ?? 60;
      const drawn = (background: Inputs, control: Control, value: unknown) => {
        const inputs = applied(background, control, value);
        return paint(module.diagrams, inputs, settle(module.config, inputs, seconds, SWEEP_STEPS));
      };
      const invisible = controls
        // Same rule as the readings sweep: a conditional control is judged against the scenarios
        // that make it matter, not only against a resting patient.
        .filter((control) =>
          backgrounds(module).every((bg) => {
            const first = drawn(bg, control, control.values[0]);
            return control.values.slice(1).every((value) => drawn(bg, control, value) === first);
          }),
        )
        .map((control) => `${id}.${control.key}`);
      expectExactly(
        invisible,
        [...NO_DIAGRAM_CORRELATE].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: controls the diagram does not show`,
      );
    });

    /**
     * Every option of a toggle group is a scenario a learner can select, and each should be worth
     * selecting. This is the same question the preset test asks, put to the categorical controls:
     * comparing only the first option against the last says nothing about the ten in between.
     */
    it('gives each toggle option a reading of its own', () => {
      const seconds = module.config.settleSeconds ?? 60;
      const ties: string[] = [];
      for (const control of controls.filter((c) => c.values.length > 2 || typeof c.values[0] === 'string')) {
        const settled = control.values.map((value) =>
          settle(module.config, applied(module.defaults, control, value), seconds, SWEEP_STEPS),
        );
        for (let i = 0; i < control.values.length; i++) {
          for (let j = i + 1; j < control.values.length; j++) {
            if (!differs(settled[i]!, settled[j]!, 0.02)) ties.push(`${id}.${control.key}:${control.values[i]}==${control.values[j]}`);
          }
        }
      }
      expectExactly(ties, [...TOGGLE_OPTION_TIES_BY_DESIGN].filter((e) => e.startsWith(`${id}.`)), `${id}: toggle options that read alike`);
    });

    it('opens on a state that is already steady', () => {
      const seconds = module.config.settleSeconds;
      if (!seconds) return; // Modules whose baseline is a trajectory declare no settle; see loopConfig.
      // Half of each run is sampled, and the comparison is of ENVELOPES rather than instants, so a
      // module that opens onto a limit cycle rather than a fixed point — a cardiac cycle, a breath,
      // a circadian day — is judged on where the cycle sits and not on the phase it was caught at.
      const opened = settle(module.config, module.defaults, seconds, FULL_STEPS, 0.5);
      const later = settle(module.config, module.defaults, seconds * 2, FULL_STEPS, 0.5);
      // Clock positions are excluded: a phase fraction, a cycle day, a pacemaker ramp — each is a
      // sawtooth saying where in the cycle the sampler landed, not what the physiology is doing,
      // and its minimum is wherever the sampling grid happened to fall. The scale is floored too,
      // so a drive wandering by four ten-thousandths of its 0..1 range is not called a 26% drift.
      const steadyKeys = (row: Record<string, number>) =>
        Object.fromEntries(Object.entries(row).filter(([key]) => !/phase|cycleday|ramp/i.test(key)));
      const drift = Math.max(
        maxRelDiff(steadyKeys(opened.low), steadyKeys(later.low), 0.01),
        maxRelDiff(steadyKeys(opened.high), steadyKeys(later.high), 0.01),
      );
      expect(
        drift,
        `${id}: still drifting at settleSeconds=${seconds}; the page opens on a transient (worst: ${worstKey(steadyKeys(opened.high), steadyKeys(later.high))} / ${worstKey(steadyKeys(opened.low), steadyKeys(later.low))})`,
      ).toBeLessThan(0.05);
    });

    it('shows a different screen for each preset the moment it is pressed', () => {
      const names = Object.keys(module.presets);
      const painted = new Map(
        names.map((name) => [
          name,
          paint(module.visible, { ...module.defaults, ...module.presets[name] }, scenarioAt(module, name, false)),
        ]),
      );
      const identical: string[] = [];
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const [a, b] = [names[i]!, names[j]!];
          if (painted.get(a) === painted.get(b)) identical.push(`${id}.${a}==${b}`);
        }
      }
      expectExactly(
        identical,
        [...SAME_SCREEN_ON_PRESS_BY_DESIGN].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: presets that draw the same screen on press`,
      );
    });

    it('settles each preset to a scenario of its own', () => {
      const names = Object.keys(module.presets);
      const shown = new Map(names.map((name) => [name, scenarioAt(module, name, false)]));
      const later = new Map(names.map((name) => [name, scenarioAt(module, name, true)]));
      const collisions: string[] = [];
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const [a, b] = [names[i]!, names[j]!];
          // AS SHOWN, not eventually. A scenario button that needs ten real minutes of watching
          // before it separates from the one beside it is the complaint this suite exists for.
          if (!differs(shown.get(a)!, shown.get(b)!, 0.02)) {
            collisions.push(`${id}.${a}==${b}${differs(later.get(a)!, later.get(b)!, 0.02) ? ' (separates later)' : ''}`);
          }
        }
      }
      expectExactly(
        collisions.map((entry) => entry.replace(' (separates later)', '')),
        [...PRESET_COLLISIONS_BY_DESIGN].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: presets that settle to the same scenario`,
      );
    });
  });
});
