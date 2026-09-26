import { describe, expect, it } from 'vitest';
import { createInitialState, step } from './engine/engine';
import { DEFAULT_DIGESTION_INPUTS, DIGESTION_PRESETS } from './engine/presets';
import type { DigestionPresetName } from './engine/presets';
import { NUTRIENT_ORDER } from './engine/absorptionSites';
import { absorptionBands, buildDigestionAbsorptionPresentation } from './presentation';
import type { DigestionInputs } from './engine/types';
import type { SceneNode } from '@/shared/presentation/types';

function settled(preset: DigestionPresetName, extra: Partial<DigestionInputs> = {}) {
  const inputs: DigestionInputs = { ...DEFAULT_DIGESTION_INPUTS, ...DIGESTION_PRESETS[preset], ...extra };
  let snapshot = step(createInitialState(), inputs, 600);
  for (let i = 0; i < 2 * 24 * 120; i += 1) snapshot = step(snapshot.state, inputs, 30);
  return { state: snapshot.state, derived: snapshot.derived, inputs, history: [], baselineHistory: null };
}

function texts(nodes: readonly SceneNode[]): Array<{ text: string; cls?: string }> {
  return nodes.flatMap((node) => {
    if (node.type === 'text') return [{ text: node.text, cls: node.cls }];
    if (node.type === 'group') return texts(node.children);
    return [];
  });
}

describe('the absorption map', () => {
  const healthy = settled('normal');

  it('opens on the whole map when no lens has been picked', () => {
    const unpicked = buildDigestionAbsorptionPresentation(healthy);
    const all = buildDigestionAbsorptionPresentation({ ...healthy, lens: 'all' });
    expect(JSON.stringify(unpicked.diagram)).toBe(JSON.stringify(all.diagram));
    expect(unpicked.lens?.initial).toBe('all');
  });

  it('offers every nutrient class, and draws a different picture for each', () => {
    const presentation = buildDigestionAbsorptionPresentation(healthy);
    const values = presentation.lens!.options.map((option) => option.value);
    expect(values).toEqual(['all', ...NUTRIENT_ORDER]);
    const pictures = new Set(values.map((lens) => JSON.stringify(buildDigestionAbsorptionPresentation({ ...healthy, lens }).diagram)));
    expect(pictures.size).toBe(values.length);
  });

  it('draws a tract and, beneath it, a villus', () => {
    const presentation = buildDigestionAbsorptionPresentation(healthy);
    expect(presentation.diagram.map((frame) => frame.key)).toEqual(['da-tract', 'da-villus']);
  });

  it('traces B12 at the terminal ileum and nowhere else', () => {
    const emphasised = absorptionBands(healthy.inputs, healthy.derived, 'b12').filter((band) => band.emphasised);
    expect(emphasised.map((band) => band.segment)).toEqual(['terminalIleum']);
  });

  it('shows the B12 site lost once the terminal ileum is resected', () => {
    const resected = settled('terminalIlealResection');
    const [site] = absorptionBands(resected.inputs, resected.derived, 'b12').filter((band) => band.emphasised);
    expect(site!.lost).toBe(true);
    // And names it on the map as well as breaking the band, so it does not rest on colour alone.
    const lensed = buildDigestionAbsorptionPresentation({ ...resected, lens: 'b12' });
    expect(texts(lensed.diagram[0]!.children).some((t) => t.text === 'B12 5%')).toBe(true);
  });

  it('routes fat out through the lacteal and everything water-soluble through the capillary', () => {
    const fat = texts(buildDigestionAbsorptionPresentation({ ...healthy, lens: 'fat' }).diagram[1]!.children).map((t) => t.text);
    const iron = texts(buildDigestionAbsorptionPresentation({ ...healthy, lens: 'ironCalciumFolate' }).diagram[1]!.children).map((t) => t.text);
    expect(fat).toContain('to lacteal, then thoracic duct');
    expect(iron).toContain('to portal vein, then liver');
  });

  it('draws colonic crypts, not villi, for the short-chain fatty acids', () => {
    const scfa = buildDigestionAbsorptionPresentation({ ...healthy, lens: 'scfa' });
    expect(texts(scfa.diagram[1]!.children).map((t) => t.text)).toContain('Colonic crypts');
  });

  it('flattens the villi in coeliac disease', () => {
    const coeliac = buildDigestionAbsorptionPresentation(settled('coeliacDisease'));
    const normal = buildDigestionAbsorptionPresentation(healthy);
    expect(JSON.stringify(coeliac.diagram[1])).not.toBe(JSON.stringify(normal.diagram[1]));
  });

  it('never names the pattern outside the verdict, in any lens', () => {
    // The verdict is withheld during a pattern question; any other text carrying the
    // classification would answer the question a few hundred pixels above it.
    for (const preset of Object.keys(DIGESTION_PRESETS) as DigestionPresetName[]) {
      const ctx = settled(preset);
      for (const lens of ['all', ...NUTRIENT_ORDER]) {
        const all = buildDigestionAbsorptionPresentation({ ...ctx, lens }).diagram.flatMap((frame) => texts(frame.children));
        const naming = all.filter((t) => t.cls !== 'verdict' && t.text.includes(ctx.derived.classification));
        expect(naming, `${preset} / ${lens}`).toEqual([]);
      }
    }
  });
});
