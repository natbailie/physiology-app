import { describe, expect, it } from 'vitest';
import { lookupTerm } from '@/shared/glossary/terms';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import type { ModulePresentation } from '@/shared/presentation/types';

/**
 * Proves that every readout tile in every module can explain itself.
 *
 * A tile is a number and a piece of jargon. Hovering the label on the web — or tapping it in the
 * native app — is supposed to say what the number IS and what an abnormal one would mean, and
 * both surfaces get that from one place: `lookupTerm`. But the lookup falls through to plain text
 * for anything undefined, which is the right behaviour and also a silent one: 308 of the 455
 * tiles in the app had no entry at all and nothing said so, on either platform.
 *
 * So this is a RATCHET on the promise, not on a percentage. Every label a module actually prints
 * must resolve, and a new readout with no definition fails here rather than shipping as a tile
 * that does nothing when a learner presses it.
 *
 * A module may answer a label with its own definition — see `MODULE_SCOPED` — which is why the
 * lookup is given the module id. Seventeen modules print a tile called `State`, and a single
 * shared entry for it could only ever have been right in one of them.
 */

type AnyConfig = EngineLoopConfig<unknown, unknown, unknown, unknown>;
type Inputs = Record<string, unknown>;
type AnyPresentation = ModulePresentation<unknown, unknown, Inputs, unknown>;

const configModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });
const presentationModules = import.meta.glob<Record<string, unknown>>('../../modules/*/presentation.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

function findByShape<T>(exports: Record<string, unknown>, ok: (value: unknown) => boolean): T | null {
  for (const value of Object.values(exports)) if (ok(value)) return value as T;
  return null;
}

/** Every readout label a module prints, read off the presentation it builds at its own defaults.
 *
 * Built rather than parsed because a module may add readouts conditionally — hpgAxis prints a
 * different half of its panel for each sex — and a regex over the source would credit labels
 * that no learner can reach while missing none of the ones they can. */
function labelsOf(id: string): string[] {
  const presentation = presentationModules[`../../modules/${id}/presentation.ts`];
  if (!presentation) return [];
  const build = findByShape<(ctx: unknown) => AnyPresentation>(
    presentation,
    (v) => typeof v === 'function' && /^build/.test(v.name) && /[Pp]resentation$/.test(v.name),
  );
  if (!build) return [];

  const config = findByShape<AnyConfig>(
    configModules[`../../modules/${id}/engine/loopConfig.ts`]!,
    (v) => !!v && typeof v === 'object' && 'step' in v && 'computeDerived' in v,
  )!;
  const defaults = findByShape<Inputs>(
    Object.fromEntries(
      Object.entries(presetModules[`../../modules/${id}/engine/presets.ts`]!).filter(([name]) => /^DEFAULT_/.test(name)),
    ),
    (v) => !!v && typeof v === 'object' && !Array.isArray(v),
  )!;

  const state = config.createInitialState();
  const derived = config.computeDerived(state, defaults);
  return build({ state, derived, inputs: defaults, history: [], baselineHistory: null }).readouts.map((r) => r.label);
}

const ids = Object.keys(configModules).map(moduleIdOf).sort();

describe('readout glossary coverage', () => {
  it('discovers every module', () => {
    expect(ids.length).toBeGreaterThan(40);
  });

  it.each(ids)('%s defines every readout label it prints', (id) => {
    const undefinedLabels = labelsOf(id).filter((label) => lookupTerm(label, id) === undefined);
    expect(undefinedLabels).toEqual([]);
  });

  it('answers a module-owned label with the module\'s own definition', () => {
    // `State` is the case the module scoping exists for: same label, seventeen different meanings.
    const thermo = lookupTerm('State', 'thermoregulation');
    const vision = lookupTerm('State', 'vision');
    expect(thermo).toBeDefined();
    expect(vision).toBeDefined();
    expect(thermo!.definition).not.toEqual(vision!.definition);
  });

  it('falls through to plain text for a label nobody defines', () => {
    expect(lookupTerm('not a physiological quantity')).toBeUndefined();
  });
});
