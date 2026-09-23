// @vitest-environment jsdom
import { createElement, type ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { DiagramView } from '@/shared/presentation/web/DiagramView';
import { ReadoutGridView } from '@/shared/presentation/web/ReadoutGridView';
import { getDiagramClasses } from '@/shared/presentation/web/diagramClasses';

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

/** The slice of a ModulePresentation the harness reads, without importing control/readout
 * accessors that depend on module-specific State/Derived/History types. */
interface ModulePresentationLike {
  diagram: readonly { type: 'frame'; viewBox: number[]; ariaLabel: string }[];
  controls: readonly ControlSpecLike[];
  readouts: readonly unknown[];
}
interface ControlSpecLike {
  label: string;
  key: string;
  kind?: string;
  min: number;
  max: number;
  step?: number;
  options?: readonly { value: string }[];
}

const configModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });
const presentationModules = import.meta.glob<Record<string, unknown>>('../../modules/*/presentation.ts', { eager: true });
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
  /** When the module presents itself as data, its standalone presentation builder. The schema
   * then drives controls/readouts/diagram instead of the legacy named-component discovery, so the
   * harness verifies the same presentation a native renderer would. */
  buildPresentation?: (ctx: unknown) => ModulePresentationLike;
  /** Absent for a schema module, which declares its controls as data — see `discoverControls`. */
  ControlPanel?: ComponentType<Record<string, unknown>>;
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
  const controlName = Object.keys(components).find((name) => /ControlPanel$/.test(name));
  const source = Object.entries(pageSources).find(([pagePath]) => moduleIdOf(pagePath) === id)![1];
  const diagrams = diagramNames(source)
    .map((name) => components[name])
    .filter((component): component is ComponentType<Record<string, unknown>> => Boolean(component));

  // A schema-driven module (a `buildXPresentation` in presentation.ts) verifies against the same
  // presentation a native renderer reads, not against named page components.
  const presentation = presentationModules[`../../modules/${id}/presentation.ts`];
  const buildPresentation = presentation
    ? (findByShape<unknown>(presentation, (v) => typeof v === 'function' && /build.*[Pp]resentation$/.test(nameOf(presentation, v))) as (ctx: unknown) => ModulePresentationLike)
    : undefined;

  return {
    id,
    config,
    defaults,
    presets,
    presetExports,
    settleOverrides,
    buildPresentation,
    ControlPanel: controlName ? components[controlName] : undefined,
    diagrams,
    visible: [
      ...diagrams,
      ...Object.entries(components)
        .filter(([name]) => /ReadoutPanel$/.test(name))
        .map(([, component]) => component),
    ],
  };
});

/** The key a value was exported under — used to find a module's `build*Presentation` builder. */
function nameOf(exports: Record<string, unknown>, value: unknown): string {
  for (const [name, v] of Object.entries(exports)) if (v === value) return name;
  return '';
}

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
/**
 * Modules that open on a TRAJECTORY rather than on a resting state, and so declare no settle: this
 * is the list `settleSeconds` being absent used to assert silently.
 *
 * Each is a module whose subject IS the progression — cerebral perfusion accumulates CSF,
 * inflammation resolves an insult, micturition fills a bladder — so settling one would jump past
 * the thing it exists to show. cellCycle and cognitiveNeuroscience are NOT here and do not need to
 * be: cellCycle's progression is carried by a phase key, which this check excludes the way the
 * drift check does, and cognitiveNeuroscience is input-pure and streams a constant readout.
 *
 * The other twelve unsettled modules are not here either, and that was measured rather than
 * assumed. Every one of them opens on values it holds — their `createInitialState()` genuinely IS
 * the resting state, which is why they never needed a settle and why adding one would have been
 * twelve calibrations in search of a problem.
 */
const OPENS_ON_A_TRAJECTORY: readonly string[] = ['cerebralPerfusion', 'inflammation', 'micturition'];

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
/**
 * How far the OPENING of a module falls outside the band it occupies once it is running, as a
 * fraction. Asked as containment rather than as a difference of two settles, because a module that
 * opens onto a limit cycle shows a different slice of that cycle in every window — the question is
 * whether the opening values are ones the module goes on to hold, not whether two windows match.
 */
function worstEscape(opening: Settled, band: Settled): { key: string; value: number } {
  let worst = { key: 'none', value: 0 };
  for (const key of Object.keys(opening.low)) {
    if (/phase|cycleday|ramp/i.test(key) || band.low[key] === undefined) continue;
    const scale = Math.max(Math.abs(band.low[key]!), Math.abs(band.high[key]!), band.high[key]! - band.low[key]!, 0.01);
    for (const [edge, over] of [
      ['low', band.low[key]! - opening.low[key]!],
      ['high', opening.high[key]! - band.high[key]!],
    ] as const) {
      const escape = Math.max(0, over) / scale;
      if (escape > worst.value) worst = { key: `${key}.${edge} ${opening.low[key]}..${opening.high[key]} vs ${band.low[key]}..${band.high[key]}`, value: escape };
    }
  }
  return worst;
}

/** Whether a resolved scenario is the module's own baseline wearing a name. Compared key by key
 * rather than by `JSON.stringify`, which answers a question about key order as well. */
function sameInputs(a: Inputs, b: Inputs): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
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
  // A schema module declares its controls as data — read them directly rather than by firing
  // events at a rendered panel. A slider becomes [min, max]; a toggle group keeps every option
  // so the sweeps exercise each selection a learner can make.
  if (module.buildPresentation) {
    const presentation = schemaFor(module, module.defaults, settle(module.config, module.defaults, module.config.settleSeconds ?? 60, SWEEP_STEPS));
    return (presentation?.controls ?? []).map((spec) =>
      spec.kind === 'toggle'
        ? { key: spec.key, label: spec.label, values: [...(spec.options ?? []).map((option) => option.value)] }
        : { key: spec.key, label: spec.label, values: [spec.min, spec.max] },
    );
  }
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
      createElement(module.ControlPanel!, { inputs, onChange: record, onSelectBed: record }),
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
  /* Coagulation is down to one: the cascade ladder now carries factor AVAILABILITY as a ring
   * around each node's activation, the lumen carries the platelet count, the breach carries vWF,
   * and the two drugs are drawn where they act. Fibrinolysis is the exception — plasmin dissolves
   * a mesh that does not exist until something is injured, so there is nothing for it to act on in
   * the resting picture. */
  'coagulation.fibrinolyticActivity',
  /* Down to one. The lymph node now draws the CD4 count as the helper cell's own radius, the B
   * cell's as its own, the resident macrophages at the site as a count, and pharmacological
   * suppression as a wash over the whole node — so a host is visibly a host before anything
   * infects it. Virulence is the exception and correctly so: it is a property of an organism that
   * has not arrived yet, and there is nothing in an uninfected tissue for it to describe. */
  'immuneResponse.pathogenVirulence',
  /* Down to one, from thirteen. The four mechanism cards now draw the HOST — IgE already on the
   * mast cell, antibody the patient already carries, the circulating pool, resident memory T cells
   * — and a strip below them draws the unit and the recipient, which is what the seven transfusion
   * scenarios are actually about. Antigen dose is the exception: it is the size of an exposure that
   * has not happened, and the challenge button is what delivers it. */
  'hypersensitivity.antigenDose',
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
const TOGGLE_OPTION_TIES_BY_DESIGN = new Set<string>([
  // Course is the renal-compensation lever: acute vs chronic changes nothing at rest because a
  // normal PaCO2 gives the kidney nothing to compensate, and the two options must not be allowed
  // to read alike once hypercapnia appears. The backgrounds sweep proves they separate under the
  // type-II presets (acute-on-chronic HCO3 34.4 vs 26.6 without compensation), and the module's
  // own engine test pins the separation down.
  /* Lighting the right eye and lighting the left read alike on a patient with two normal eyes, and
   * that is the finding rather than a gap: the consensual reflex means a normal pupil pair responds
   * the same way whichever eye the torch is in. The asymmetry IS the abnormality — swing the torch
   * with `leftOpticNerveAfferent` down and the afferent defect appears, which is the manoeuvre this
   * module's own questions stage. Judged against the defaults, so a healthy examination is what it
   * measures.
   */
  /* A stimulator changes nothing in a patient who has nothing wrong with them, which is the whole
   * reason it is implanted in the ones who do. Deep brain stimulation eases bradykinesia, damps
   * resting tremor and quietens chorea and ballism — and the default patient has none of those, so
   * off and on settle identically. Judged against the defaults; under `advancedParkinson` or
   * `hemiballismus` the two separate, which is what the module teaches.
   */
  'motorControl.deepBrainStimulation:off==on',
  'vision.torchEye:right==left',
  'respiratoryFailure.course:acute==chronic',
]);

/**
 * Two scenarios that draw the same screen AT THE MOMENT THEY ARE PRESSED, one line of reason each.
 *
 * This is a different question from the one below, and keeping them on one list was hiding an
 * answer. A host module's scenarios are a patient waiting for an event — the preset comments say so
 * themselves, "hit Infect", "deposit an insult" — so on press the drawing is identical and correct.
 * They no longer settle alike, which is why they have come OFF the collisions list and stayed on
 * this one.
 *
 * This list grew by four modules when `Term` stopped taking its tooltip id from `useId`. That
 * counter advances across every render in the process, so any module with at least one readout
 * label the glossary defined painted a different id on every press and NO pair of its presets
 * could ever compare equal — the check was passing vacuously for exactly the modules that had
 * definitions. It does not any more, and the entries below are what it found once it could see.
 */
const SAME_SCREEN_ON_PRESS_BY_DESIGN = new Set<string>([
  /* immuneResponse and inflammation used to hold twenty-one entries between them here, on the
   * grounds that nothing has happened yet when the button is pressed. Both came off by DRAWING THE
   * HOST instead of the reaction: a neutropenic patient differs from a healthy one in the cell
   * counts a diagram of cells ought to carry, and a severe insult is a bigger thing at the moment
   * it lands than a mild one. "Nothing has happened yet" was true of the reaction and false of the
   * patient, which is worth remembering against the entries that remain below.
   */
  // The two ventilation presets differ only in PaCO2, which moves vessel calibre over about a
  // minute rather than instantly.
  'cerebralPerfusion.hyperventilated==hypoventilated',
  // Persistent pulmonary hypertension IS a first breath that fails to drop pulmonary resistance,
  // so the two are the same circulation until the resistance has had time not to fall.
  'fetalCirculation.firstBreath==pphn',
  /* The last hypersensitivity pair, and the only one that survived drawing the host: both of these
   * resolve to the module's DEFAULTS, byte for byte. A naive patient meeting an antigen for the
   * first time and a patient receiving a compatible unit are the same person with the same
   * immunology, and the absence of a reaction in both is the teaching. Its sibling entry on
   * PRESET_COLLISIONS_BY_DESIGN says the same thing about where they settle. */
  'hypersensitivity.naiveFirstExposure==compatibleTransfusion',
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

/**
 * Scenarios that EVAPORATE: distinguishable from a healthy patient the moment they are pressed, and
 * indistinguishable two minutes later. One line of reason each.
 *
 * This is the complaint the module pages are actually judged on — press "Haemorrhage", watch the
 * cardiac output fall, and watch it climb back while the insult is still applied. It is a different
 * question from the collision check above, which asks whether two scenarios differ from EACH OTHER;
 * two scenarios can stay perfectly distinct from one another while both quietly return to normal.
 *
 * Where the reason is a genuine compensation — a reflex correcting the insult, which is the
 * teaching rather than a bug — the entry comes off this list by exposing that compensation as a
 * CONTROL, so the learner can watch the insult bare and then switch the reflex on. It does not come
 * off by deleting the mechanism.
 */
const SETTLES_BACK_TO_NORMAL_BY_DESIGN = new Set<string>([]);

/**
 * Individual readings that return to normal while the insult is still applied.
 *
 * The finer backlog, and the one that does the work: a scenario may legitimately keep one
 * abnormality and lose another — a compensated haemorrhage holds its pressure by raising the heart
 * rate, and the pressure coming back IS the teaching as long as the rate stays up. Recorded
 * quantity by quantity so that distinction survives.
 */
const READINGS_THAT_RETURN_TO_NORMAL = new Set<string>([
  // Baroreceptors RESET: `baroreflexSetpointMmHg` chases the pressure it is actually seeing over
  // 900 s, so by the time a learner looks up, the reflex has accepted the failing kidney's pressure
  // as normal, the drive has returned to zero, and the vascular tone and reabsorption it was
  // holding go with it. That is why chronic hypertension persists rather than being reflexively
  // corrected away, and it is the module's own teaching.
  //
  // These two stay on the list BECAUSE THE DEFAULT PATIENT HAS AN INTACT REFLEX, and the default
  // has to remain the calibrated one — every band in `engine/references.ts` and the committed Pulse
  // trace are measured against it. What has changed is that the learner can now see it happen and
  // opt out: `baroreflexGain` is a control, and the "Heart failure, no reflex" scenario is one
  // press. Deleting the resetting would be deleting the lesson.
  'cardiorenal.kidneyFailure.effectiveSVR',
  'cardiorenal.kidneyFailure.reabsorptionFraction',
  // Wash-in COMPLETING is the module. A slow agent and a low flow both reach the same effect-site
  // partial pressure eventually, which is exactly what "slow" means; the separation this module
  // teaches is in the trajectory, which the charts carry, not in the endpoint.
  'anaesthesia.halothaneSlowWashin.effectSiteAgentPct',
  'anaesthesia.lowFlowRebreathing.classification',
  'anaesthesia.lowFlowRebreathing.washInProgress',
  // The lymphatic safety factor: lymph flow rises to carry the extra filtrate and then stops
  // rising once it is carrying it. Oedema is what happens when it cannot, and `oedemaRisk` holds.
  'capillaryExchange.liverFailure.lymphFlowMlPerMin',
  // Instantaneous waveform samples, not readings a learner holds a value against. Both are
  // documented as such in `EcgDerived` ("net voltage in the selected lead", "net instantaneous
  // dipole"), and their windowed mean over a cardiac cycle converges for any rhythm. The reading
  // that matters here is `meanVentricularRateBpm` — "the number a bedside monitor displays" — and
  // it holds under all three scenarios.
  'ecgConduction.atrialFibrillation.dipoleMagnitude',
  'ecgConduction.atrialFibrillation.ecgVoltageMv',
  'ecgConduction.atrialFibrillation.heartRateBpm',
  'ecgConduction.firstDegreeBlock.dipoleMagnitude',
  'ecgConduction.firstDegreeBlock.ecgVoltageMv',
  'ecgConduction.longQt.ecgVoltageMv',
  // Same class: `iK` is an instantaneous ionic current, and a cold axon at rest carries the same
  // resting potassium current as a warm one. The scenario holds where the module teaches it —
  // the action potential's shape and duration.
  'membranePotentials.hypothermia.iK',
]);

/**
 * Scenarios the DRAWING does not show — the preset-level half of CLAUDE.md's "every control needs a
 * visible correlate".
 *
 * `NO_DIAGRAM_CORRELATE` asks this of sliders. Nothing asked it of the scenario buttons, because
 * both preset checks compare `visible` markup — the diagram PLUS the readout tiles — so a preset
 * that moves a number and leaves the picture alone passes them both. A learner presses "Septic" and
 * looks at a healthy body.
 *
 * Asked against normal rather than pairwise: whether two scenarios draw each other is the collision
 * question, and it is already asked twice above.
 */
const PRESET_NOT_IN_THE_PICTURE = new Set<string>([
  // The four fixed-cascade drawings, and the same four `NO_DIAGRAM_CORRELATE` already names for
  // their sliders: each draws an invariant cascade with every reading living in the tiles beside
  // it, so no input reaches the picture and no scenario can move it. Working one backlog works
  // both, and these are the diagrams to convert first.
]);

/** Renders the given components against a settled scenario and returns their markup. Everything a
 * learner can see is either in the diagram or in the readout tiles, so comparing this markup is
 * the closest a test gets to asking "did the screen change?". */
/** A standalone presentation for a settled frame, as a native renderer would get it. */
function schemaFor(module: ModuleUnderTest, inputs: Inputs, settled: Settled): ModulePresentationLike | undefined {
  if (!module.buildPresentation) return undefined;
  return module.buildPresentation({
    state: settled.state,
    derived: settled.derived,
    inputs,
    history: [],
    baselineHistory: null,
  });
}

/** Renders a schema module's diagram or diagram-plus-readouts and returns the HTML, the same
 * serialization `paint` produces for a legacy module — so a sweep of a schema module compares
 * picture against picture the same way. */
function paintSchema(module: ModuleUnderTest, parts: 'diagram' | 'visible', inputs: Inputs, settled: Settled): string {
  const presentation = schemaFor(module, inputs, settled);
  const children: React.ReactElement[] = [];
  if (parts === 'visible') {
    children.push(
      createElement(ReadoutGridView as ComponentType<{ readouts: readonly unknown[]; ctx: unknown }>, {
        readouts: presentation?.readouts ?? [],
        ctx: { state: settled.state, derived: settled.derived, inputs },
      }),
    );
  }
  for (const frame of presentation?.diagram ?? []) {
    children.push(
      createElement(DiagramView as ComponentType<{ frame: unknown; classes: unknown }>, {
        frame: frame as never,
        classes: getDiagramClasses(module.id),
      }),
    );
  }
  const { container } = render(
    createElement(ModuleShellProvider as ComponentType<{ blinded: boolean }>, { blinded: false }, ...children),
  );
  const html = container.innerHTML;
  cleanup();
  return html;
}

function paint(components: ComponentType<Record<string, unknown>>[], inputs: Inputs, settled: Settled): string {
  const props = { derived: settled.derived, inputs, state: settled.state, history: [], baselineHistory: null, excitationPulse: 0 };  const { container } = render(
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

/**
 * When a scenario is judged: the moment the button is pressed, or after a learner has watched it.
 *
 * `watched` used to be `FULL_STEPS * maxDtSeconds`, which is a step budget rather than a horizon
 * and is SHORTER than the shown one for every fast-`timeScale` module — electrolyteBalance settles
 * 10000 simulated seconds and was then compared against 3000, so its "later" run happened earlier.
 * Deriving it from the shown horizon plus real watching time makes it monotonic by construction.
 */
type Phase = 'shown' | 'watched';

/**
 * Real seconds of watching a scenario is judged over.
 *
 * A learner who presses "Septic" and reads the panel is not going to sit there for an hour: this is
 * the window in which "it stayed" either is or is not true. Converted to simulated time by the
 * module's own `timeScale`, and capped by a step budget, because at 3600x two real minutes is five
 * simulated days.
 */
const WATCHED_REAL_SECONDS = 120;
const REVERT_STEPS = 120_000;

/** Simulated seconds and the step cap a phase is measured over. Always `watched >= shown`. */
function horizonOf(module: ModuleUnderTest, name: string | null, phase: Phase): [number, number] {
  const shown = (module.config.settleSeconds ?? 0) + (name ? (module.settleOverrides[name] ?? 0) : 0);
  if (phase === 'shown') return [shown, FULL_STEPS];
  return [shown + WATCHED_REAL_SECONDS * module.config.timeScale, REVERT_STEPS];
}

/**
 * `settle`, memoised on the run it describes.
 *
 * Five `it` blocks now settle every preset of every module, and several of them settle the same
 * scenario at the same horizon — the defaults alone are re-run once per preset by `normalAt`. The
 * cache is the same device `shared/engine/settle.ts` uses on the app's own opening state, and it
 * makes this suite faster than it was before the revert checks were added rather than slower.
 */
const settleCache = new Map<string, Settled>();
function settledAt(module: ModuleUnderTest, inputs: Inputs, seconds: number, stepCap: number): Settled {
  const key = `${module.id}|${JSON.stringify(inputs)}|${seconds}|${stepCap}`;
  let hit = settleCache.get(key);
  if (!hit) {
    hit = settle(module.config, inputs, seconds, stepCap);
    settleCache.set(key, hit);
  }
  return hit;
}

/** A scenario as the page shows it on press, or after a learner has watched it for two minutes. */
function scenarioAt(module: ModuleUnderTest, name: string, phase: Phase): Settled {
  const [seconds, cap] = horizonOf(module, name, phase);
  return settledAt(module, { ...module.defaults, ...module.presets[name] }, seconds, cap);
}

/**
 * The same module with nothing wrong with it, at the same horizon.
 *
 * Subtracting this is what lets a TRAJECTORY module be asked whether its scenario held: cellCycle,
 * micturition, inflammation and cerebralPerfusion have all moved on by the far horizon under every
 * scenario including the healthy one, and comparing a scenario against its own earlier self would
 * read that shared progression as universal reversion.
 */
function normalAt(module: ModuleUnderTest, phase: Phase): Settled {
  const [seconds, cap] = horizonOf(module, null, phase);
  return settledAt(module, module.defaults, seconds, cap);
}

/**
 * How much of a scenario's departure from normal SURVIVES, per reading.
 *
 * Unsigned on purpose. A value that overshoots and comes back has not reverted, and neither has one
 * that crosses normal on its way somewhere else — what is left, not which way it went.
 */
function departures(scenario: Settled, normal: Settled): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(scenario.mean)) {
    const scale = Math.max(Math.abs(normal.mean[key] ?? 0), Math.abs(scenario.mean[key]!), 1e-9);
    out[key] = Math.abs(scenario.mean[key]! - (normal.mean[key] ?? 0)) / scale;
  }
  return out;
}

/**
 * Where in a cycle the sampler landed, which is not a reading.
 *
 * The same exclusion the drift check above already applies, and for the same reason: a phase
 * fraction, a cycle day or a pacemaker ramp is a sawtooth saying where the sampling grid fell, not
 * what the physiology is doing. Without it five mechanicalVentilation and respiratoryMechanics
 * scenarios were reported as reverting on `breathPhaseFraction` alone, while every pressure and
 * volume in the same module held.
 */
const CLOCK_POSITION = /phase|cycleday|ramp/i;

/** A reading counts as having DEPARTED when it sits this far from normal, as a fraction of its own
 * size. Above `differs`'s 0.02, so a scenario that barely moved a number is not then judged on
 * whether it held it. */
const DEPARTED = 0.05;
/** …and as having COME BACK when this little of that departure is left. */
const HELD = 0.25;

/** The readings of one scenario that departed on press and had returned to normal by the time a
 * learner looked up. The third clause is what stops a reading that went from 300% of normal to 140%
 * being called a reversion: most of the departure is gone, but the patient is still abnormal. */
function readingsThatReturned(module: ModuleUnderTest, name: string): string[] {
  const onPress = departures(scenarioAt(module, name, 'shown'), normalAt(module, 'shown'));
  const later = departures(scenarioAt(module, name, 'watched'), normalAt(module, 'watched'));
  const returned = Object.keys(onPress).filter(
    (key) =>
      !CLOCK_POSITION.test(key) &&
      onPress[key]! > DEPARTED &&
      later[key]! < HELD * onPress[key]! &&
      later[key]! < DEPARTED,
  );
  // The classification strings a numeric pass cannot see, and the sharpest evidence there is: the
  // module has stopped calling it shock.
  const shown = scenarioAt(module, name, 'shown');
  const watched = scenarioAt(module, name, 'watched');
  if (shown.labels !== normalAt(module, 'shown').labels && watched.labels === normalAt(module, 'watched').labels) {
    returned.push('classification');
  }
  return returned.sort();
}

describe('every control moves the model', () => {
  it('discovered every module', () => {
    expect(modules.length).toBeGreaterThanOrEqual(45);
    expect(modules.filter((m) => !m.presets || !m.defaults).map((m) => m.id)).toEqual([]);
    // Schema modules present their diagram AND their controls as data rather than as named page
    // components, so both legacy lists are legitimately empty for them; every other module must
    // render something in each slot.
    expect(modules.filter((m) => m.diagrams.length === 0 && !m.buildPresentation).map((m) => m.id)).toEqual([]);
    expect(modules.filter((m) => !m.ControlPanel && !m.buildPresentation).map((m) => m.id)).toEqual([]);
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
        return module.buildPresentation
          ? paintSchema(module, 'diagram', inputs, settle(module.config, inputs, seconds, SWEEP_STEPS))
          : paint(module.diagrams, inputs, settle(module.config, inputs, seconds, SWEEP_STEPS));
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

    /**
     * The unsettled half of the question above, and it used to be an early `return`.
     *
     * A module that declares no settle opens on `createInitialState()`, which the loop hook's own
     * docblock calls a plausible starting point rather than a steady state — so "no settle" was an
     * unchecked claim that the raw initial state is good enough, and a module that simply never had
     * one calibrated was indistinguishable from one that does not need it. This asks the claim
     * directly: is every value the module opens on one it goes on to hold?
     */
    it('opens on values it holds, or says it is a trajectory', () => {
      if (module.config.settleSeconds) return;
      // The module's own opening window — the simulated time its chart shows — measured against
      // eight more of them.
      const window = module.config.historyCapacity * Math.min(module.config.maxDtSeconds, module.config.timeScale / 60);
      const opening = settle(module.config, module.defaults, window, FULL_STEPS, 1);
      const band = settle(module.config, module.defaults, window * 9, FULL_STEPS, 8 / 9);
      const escape = worstEscape(opening, band);
      const trajectory = OPENS_ON_A_TRAJECTORY.includes(id);
      expect(
        escape.value < 0.05,
        trajectory
          ? `${id}: listed as opening on a trajectory but opens steady; take it off OPENS_ON_A_TRAJECTORY`
          : `${id}: opens on a transient and declares no settle (worst: ${escape.key})`,
      ).toBe(!trajectory);
    });

    it('opens on a state that is already steady', () => {
      const seconds = module.config.settleSeconds;
      if (!seconds) return; // Covered by the trajectory check above.
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
          module.buildPresentation
            ? paintSchema(module, 'visible', { ...module.defaults, ...module.presets[name] }, scenarioAt(module, name, 'shown'))
            : paint(module.visible, { ...module.defaults, ...module.presets[name] }, scenarioAt(module, name, 'shown')),
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
      const shown = new Map(names.map((name) => [name, scenarioAt(module, name, 'shown')]));
      const later = new Map(names.map((name) => [name, scenarioAt(module, name, 'watched')]));
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

    /**
     * Does the scenario still exist by the time the learner has finished reading the panel?
     *
     * Every check above measures a scenario AT ONE MOMENT. This is the only one that asks whether
     * it lasts, and it is the question a learner asks by doing nothing at all for two minutes.
     */
    it('keeps each preset a scenario for as long as a learner watches', () => {
      const evaporated = Object.keys(module.presets)
        .filter(
          (name) =>
            differs(scenarioAt(module, name, 'shown'), normalAt(module, 'shown'), 0.02) &&
            !differs(scenarioAt(module, name, 'watched'), normalAt(module, 'watched'), 0.02),
        )
        .map((name) => `${id}.${name}`);
      expectExactly(
        evaporated,
        [...SETTLES_BACK_TO_NORMAL_BY_DESIGN].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: scenarios that settle back to normal`,
      );
    });

    it('holds every reading that departed when the preset was pressed', () => {
      const [seconds] = horizonOf(module, null, 'watched');
      const returned = Object.keys(module.presets).flatMap((name) =>
        readingsThatReturned(module, name).map((key) => `${id}.${name}.${key}`),
      );
      expectExactly(
        returned,
        [...READINGS_THAT_RETURN_TO_NORMAL].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: readings that return to normal while the scenario is still applied` +
          ` (watched over ${seconds.toFixed(0)} simulated seconds` +
          ` — ${(seconds / module.config.timeScale).toFixed(0)} real)`,
      );
    });

    it('draws a different picture for each preset', () => {
      const normal = paintSchema(module, 'diagram', module.defaults, normalAt(module, 'shown'));
      const unseen = Object.keys(module.presets)
        // A module's healthy scenario IS the defaults — 48 of the 51 ship one, under a name of its
        // own ("Normal daylight", "Healthy host", "Euthyroid"). Asking it to draw something other
        // than a healthy body is asking it to lie, so it is excluded by COMPARISON rather than by
        // name: a preset that resolves to the defaults is normal whatever its author called it.
        .filter((name) => !sameInputs({ ...module.defaults, ...module.presets[name] }, module.defaults))
        .filter(
          (name) =>
            paintSchema(
              module,
              'diagram',
              { ...module.defaults, ...module.presets[name] },
              scenarioAt(module, name, 'shown'),
            ) === normal,
        )
        .map((name) => `${id}.${name}`);
      expectExactly(
        unseen,
        [...PRESET_NOT_IN_THE_PICTURE].filter((entry) => entry.startsWith(`${id}.`)),
        `${id}: scenarios the diagram does not show`,
      );
    });
  });
});
