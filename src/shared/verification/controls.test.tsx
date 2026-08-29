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
  low: unknown;
  high: unknown;
}

/**
 * Every control the panel renders, with the ends of its range — learnt by driving the real UI.
 *
 * Ranges live inside eight thousand lines of control-panel JSX and nowhere else. Reading them off
 * the rendered inputs keeps this honest: it tests the range a learner can actually reach, and it
 * cannot drift out of date the way a duplicated table would. Toggle groups are swept the same way,
 * by clicking each option and recording what it asks for.
 */
function discoverControls(module: ModuleUnderTest): Control[] {
  const calls: { key: string; value: unknown }[] = [];
  // Recorded from the raw arguments: a control wired straight to a ToggleGroup calls back with one
  // argument, which is a selection rather than an input change and is not a control to sweep.
  const onChange = (...args: unknown[]) => {
    if (args.length === 2 && typeof args[0] === 'string') calls.push({ key: args[0], value: args[1] });
  };
  const { container } = render(
    createElement(
      ModuleShellProvider as ComponentType<{ blinded: boolean }>,
      { blinded: false },
      createElement(module.ControlPanel, { inputs: module.defaults, onChange, onSelectBed: onChange }),
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
    if (calls.length !== 1) continue;
    controls.push({ key: calls[0]!.key, label, low: min, high: max });
  }

  // Toggle groups: each option is a button that asks for one value of one input.
  const byKey = new Map<string, { label: string; values: unknown[] }>();
  for (const button of Array.from(container.querySelectorAll('button'))) {
    calls.length = 0;
    fireEvent.click(button);
    if (calls.length !== 1) continue;
    const { key, value } = calls[0]!;
    const seen = byKey.get(key) ?? { label: button.textContent ?? key, values: [] };
    if (!seen.values.some((v) => Object.is(v, value))) seen.values.push(value);
    byKey.set(key, seen);
  }
  for (const [key, { label, values }] of byKey) {
    if (values.length < 2) continue;
    controls.push({ key, label: `${label} (toggle)`, low: values[0], high: values.at(-1) });
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
      const low = settle(module.config, { ...background, [control.key]: control.low }, seconds, cap);
      const high = settle(module.config, { ...background, [control.key]: control.high }, seconds, cap);
      if (differs(low, high)) return true;
    }
  }
  return false;
}

/**
 * Controls the diagram does not show — the outstanding half of CLAUDE.md's "every control needs a
 * visible correlate".
 *
 * This is a BACKLOG, not a set of exemptions. Each entry is a slider that moves the numbers and
 * leaves the picture untouched, which is the drift CLAUDE.md already names as the thing that went
 * furthest wrong in this app. Twelve diagrams are involved; four of them (coagulation, immune
 * response, hypersensitivity, inflammation) show none of their controls at all, because each draws
 * a fixed cascade with the readings living entirely in the readout tiles beside it.
 *
 * The list is declared here so it can be read and worked off rather than growing in silence. Take
 * entries OUT as diagrams gain the structures; nothing should ever be added without a reason.
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
  'calciumHomeostasis.dietaryPhosphateIntake',
  'digestionAbsorption.mealLactoseGrams',
  'gastrointestinal.mealFatGrams',
  'gastrointestinal.mealCarbGrams',
  'fetalCirculation.prostaglandinLevel',
  'liverPhysiology.albuminGPerL',
  'muscleContraction.extracellularCalcium',
  'micturition.cortexInhibitsMicturition',
  // The infarct shows on the ECG strip and the twelve-lead grid, both of which sit in the charts
  // slot; the conduction schematic beside them draws timing only.
  'ecgConduction.ischemicInjury',
  'ecgConduction.injuryTerritory',
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

/** Two scenarios that genuinely settle to the same physiology, one line of reason each. */
const PRESET_COLLISIONS_BY_DESIGN = new Set<string>([
  // Both are the absence of a reaction, which is the teaching: a compatible transfusion is a
  // non-event, and so is a first exposure to an antigen you have never met.
  'hypersensitivity.naiveFirstExposure==compatibleTransfusion',
  // Same three scenarios, same reason as the controls above: the meal and the insulin are events.
  'glucoseRegulation.normal==fasting',
  'glucoseRegulation.normal==insulinOverdose',
  'glucoseRegulation.fasting==insulinOverdose',
  'cellCycle.irradiated==tp53Mutated',
  // Two modules whose scenarios are a HOST, waiting for an event. Their own preset comments say so
  // — "hit Infect", "deposit an insult" — and the host differences appear the moment one lands.
  ...['healthyHost==intracellularPathogen','healthyHost==neutropenia','healthyHost==hivCd4Depletion','healthyHost==bCellDeficiency','healthyHost==transplantImmunosuppression','intracellularPathogen==neutropenia','intracellularPathogen==hivCd4Depletion','intracellularPathogen==bCellDeficiency','intracellularPathogen==transplantImmunosuppression','neutropenia==hivCd4Depletion','neutropenia==bCellDeficiency','neutropenia==transplantImmunosuppression','hivCd4Depletion==bCellDeficiency','hivCd4Depletion==transplantImmunosuppression','bCellDeficiency==transplantImmunosuppression'].map((pair) => `immuneResponse.${pair}`),
  ...['normal==acuteCellulitis','normal==severeBacterialLoad','normal==steroidsOverInfection','acuteCellulitis==severeBacterialLoad','acuteCellulitis==steroidsOverInfection','severeBacterialLoad==steroidsOverInfection'].map((pair) => `inflammation.${pair}`),
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

    it('changes a reading when each control is swept end to end', () => {
      const inert = controls
        .filter((control) => !NOT_SWEEPABLE.has(`${id}.${control.key}`))
        .filter((control) => !sweepChangesReadings(module, control))
        .map((control) => `${control.label} (${control.key})`);
      expect(inert, `${id}: controls that change no reading at either end:\n  ${inert.join('\n  ')}`).toEqual([]);
    });

    it('changes the diagram when each control is swept end to end', () => {
      const seconds = module.config.settleSeconds ?? 60;
      const drawn = (background: Inputs, control: Control, value: unknown) => {
        const inputs = { ...background, [control.key]: value };
        return paint(module.diagrams, inputs, settle(module.config, inputs, seconds, SWEEP_STEPS));
      };
      const invisible = controls
        .filter((control) => !NO_DIAGRAM_CORRELATE.has(`${id}.${control.key}`))
        // Same rule as the readings sweep: a conditional control is judged against the scenarios
        // that make it matter, not only against a resting patient.
        .filter((control) => backgrounds(module).every((bg) => drawn(bg, control, control.low) === drawn(bg, control, control.high)))
        .map((control) => `${control.label} (${control.key})`);
      expect(invisible, `${id}: controls the diagram does not show:\n  ${invisible.join('\n  ')}`).toEqual([]);
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
          if (PRESET_COLLISIONS_BY_DESIGN.has(`${id}.${a}==${b}`)) continue;
          if (painted.get(a) === painted.get(b)) identical.push(`${a} == ${b}`);
        }
      }
      expect(identical, `${id}: presets that draw the same screen on press:\n  ${identical.join('\n  ')}`).toEqual([]);
    });

    it('settles each preset to a scenario of its own', () => {
      const names = Object.keys(module.presets);
      const shown = new Map(names.map((name) => [name, scenarioAt(module, name, false)]));
      const later = new Map(names.map((name) => [name, scenarioAt(module, name, true)]));
      const collisions: string[] = [];
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const [a, b] = [names[i]!, names[j]!];
          if (PRESET_COLLISIONS_BY_DESIGN.has(`${id}.${a}==${b}`)) continue;
          // AS SHOWN, not eventually. A scenario button that needs ten real minutes of watching
          // before it separates from the one beside it is the complaint this suite exists for.
          if (!differs(shown.get(a)!, shown.get(b)!, 0.02)) {
            collisions.push(differs(later.get(a)!, later.get(b)!, 0.02) ? `${a} == ${b} on press` : `${a} == ${b}`);
          }
        }
      }
      expect(collisions, `${id}: presets that settle to the same scenario:\n  ${collisions.join('\n  ')}`).toEqual([]);
    });
  });
});
