import { describe, expect, it } from 'vitest';
import { createInitialState, step } from './engine';
import { DEFAULT_DIGESTION_INPUTS, DIGESTION_PRESETS } from './presets';
import type { DigestionPresetName } from './presets';
import {
  ABSORPTION_SITES,
  GUT_SEGMENTS,
  NUTRIENT_ORDER,
  SITE_LOST_BELOW,
  isSiteOf,
  siteFunction,
  smallBowelSecreting,
} from './absorptionSites';
import type { DigestionInputs } from './types';

function settled(preset: DigestionPresetName) {
  const inputs: DigestionInputs = { ...DEFAULT_DIGESTION_INPUTS, ...DIGESTION_PRESETS[preset] };
  let snapshot = step(createInitialState(), inputs, 600);
  for (let i = 0; i < 3 * 24 * 120; i += 1) snapshot = step(snapshot.state, inputs, 30);
  return { inputs, derived: snapshot.derived };
}

describe('the site map', () => {
  it('accounts for all of each class somewhere along the tract', () => {
    for (const nutrient of NUTRIENT_ORDER) {
      const total = Object.values(ABSORPTION_SITES[nutrient]).reduce((sum, share) => sum + (share ?? 0), 0);
      expect(total, nutrient).toBeCloseTo(1, 6);
    }
  });

  it('takes up B12 at the terminal ileum and nowhere else', () => {
    expect(GUT_SEGMENTS.filter((segment) => isSiteOf('b12', segment))).toEqual(['terminalIleum']);
  });

  it('takes up short-chain fatty acids only in the colon, where bacteria make them', () => {
    expect(GUT_SEGMENTS.filter((segment) => isSiteOf('scfa', segment))).toEqual(['colon']);
  });

  it('puts iron, calcium and folate proximally, clear of the ileum', () => {
    expect(isSiteOf('ironCalciumFolate', 'duodenum')).toBe(true);
    expect(isSiteOf('ironCalciumFolate', 'ileum')).toBe(false);
    expect(isSiteOf('ironCalciumFolate', 'terminalIleum')).toBe(false);
  });

  it('has most of the water gone before the colon sees it', () => {
    expect(ABSORPTION_SITES.waterSodium.colon!).toBeLessThan(ABSORPTION_SITES.waterSodium.jejunum!);
  });
});

describe('what disease takes away', () => {
  it('leaves every site working in health', () => {
    // Not 1.0 everywhere: a healthy colon runs its salvage a little below the ceiling, because a
    // few grams of faecal fat and spilt bile salt reach it even in health.
    const { inputs, derived } = settled('normal');
    for (const nutrient of NUTRIENT_ORDER) {
      for (const segment of GUT_SEGMENTS) {
        if (!isSiteOf(nutrient, segment)) continue;
        expect(siteFunction(nutrient, segment, inputs, derived), `${nutrient} at ${segment}`).toBeGreaterThan(0.8);
      }
    }
  });

  it('starves iron, calcium and folate in coeliac disease while B12 rides past untouched', () => {
    const { inputs, derived } = settled('coeliacDisease');
    expect(siteFunction('ironCalciumFolate', 'duodenum', inputs, derived)).toBeLessThan(SITE_LOST_BELOW);
    expect(siteFunction('b12', 'terminalIleum', inputs, derived)).toBeGreaterThan(0.9);
  });

  it('takes B12 and bile salts together at terminal ileal resection, and leaves iron alone', () => {
    const { inputs, derived } = settled('terminalIlealResection');
    expect(siteFunction('b12', 'terminalIleum', inputs, derived)).toBeLessThan(SITE_LOST_BELOW);
    expect(siteFunction('bileSalts', 'terminalIleum', inputs, derived)).toBeLessThan(SITE_LOST_BELOW);
    expect(siteFunction('ironCalciumFolate', 'duodenum', inputs, derived)).toBeGreaterThan(0.9);
  });

  it('turns the small bowel from absorbing water to secreting it under a VIP drive', () => {
    const { inputs, derived } = settled('vipoma');
    expect(smallBowelSecreting(inputs)).toBe(true);
    expect(siteFunction('waterSodium', 'jejunum', inputs, derived)).toBeLessThan(0.5);
    // The drive poisons the colon too, so salvage cannot make up the difference.
    expect(siteFunction('waterSodium', 'colon', inputs, derived)).toBeLessThan(0.9);
  });

  it('loses protein with the pancreas but keeps carbohydrate, which has brush-border understudies', () => {
    const { inputs, derived } = settled('pancreaticInsufficiency');
    expect(siteFunction('protein', 'jejunum', inputs, derived)).toBeLessThan(0.6);
    expect(siteFunction('carbohydrate', 'jejunum', inputs, derived)).toBeGreaterThan(0.9);
  });
});
