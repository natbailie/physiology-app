import { b12UptakeFraction, ironSurfaceFactor } from './micronutrients';
import { clamp } from '@/shared/lib/math';
import type { DigestionDerived, DigestionInputs } from './types';

/**
 * Where along the tract each class of nutrient is taken up, and how much of that site is working.
 *
 * Site specificity is the part of absorption that turns anatomy into diagnosis: coeliac disease
 * (a proximal lesion) starves iron and folate while B12 rides past untouched, and ileal Crohn's
 * does the opposite. The engine already carries every capacity that decides this — surface area,
 * the terminal ileum, the colon, the secretory drive — and this file lays them out along the gut.
 */

export type GutSegment = 'stomach' | 'duodenum' | 'jejunum' | 'ileum' | 'terminalIleum' | 'colon';

export const GUT_SEGMENTS: readonly GutSegment[] = ['stomach', 'duodenum', 'jejunum', 'ileum', 'terminalIleum', 'colon'];

export type NutrientClass =
  | 'carbohydrate'
  | 'protein'
  | 'fat'
  | 'ironCalciumFolate'
  | 'b12'
  | 'bileSalts'
  | 'waterSodium'
  | 'scfa'
  | 'alcohol';

export const NUTRIENT_ORDER: readonly NutrientClass[] = [
  'carbohydrate',
  'protein',
  'fat',
  'ironCalciumFolate',
  'b12',
  'bileSalts',
  'waterSodium',
  'scfa',
  'alcohol',
];

/**
 * The usual share of each class's daily uptake at each site, 0-1, summing to 1 per class.
 *
 * This is textbook weighting for drawing, NOT a flux the engine integrates, which is why it
 * asserts no reference band: it says where the work is done in health, and `siteFunction` says
 * how much of that site is left. The shapes it encodes are the ones examiners ask about —
 * B12 at the terminal ileum only, iron and calcium in the duodenum, short-chain fatty acids only
 * where bacteria make them, and most of the water gone before the colon ever sees it.
 */
export const ABSORPTION_SITES: Readonly<Record<NutrientClass, Readonly<Partial<Record<GutSegment, number>>>>> = {
  // Monosaccharides through SGLT1 and GLUT5, mostly before the mid-jejunum.
  carbohydrate: { duodenum: 0.35, jejunum: 0.55, ileum: 0.1 },
  // Di- and tripeptides through PepT1, free amino acids through their own carriers.
  protein: { duodenum: 0.3, jejunum: 0.55, ileum: 0.15 },
  // Micelles deliver to the brush border; chylomicrons leave by the lacteal.
  fat: { duodenum: 0.2, jejunum: 0.65, ileum: 0.15 },
  // DMT1 for iron, calbindin-assisted calcium, folate through PCFT — all proximal.
  ironCalciumFolate: { duodenum: 0.7, jejunum: 0.3 },
  // Intrinsic factor-bound, through cubilin, and nowhere else.
  b12: { terminalIleum: 1 },
  // ASBT does nearly all of it; a little passive uptake proximally.
  bileSalts: { jejunum: 0.05, terminalIleum: 0.95 },
  // About nine litres a day arrive; the jejunum takes most, the colon salvages the rest.
  waterSodium: { jejunum: 0.55, ileum: 0.3, colon: 0.15 },
  // Made by colonic bacteria from fibre, and taken up where they are made.
  scfa: { colon: 1 },
  // Passive diffusion, and the one thing the stomach absorbs in quantity.
  alcohol: { stomach: 0.2, duodenum: 0.4, jejunum: 0.4 },
};

/** Whether a class is taken up at a segment at all in health. */
export function isSiteOf(nutrient: NutrientClass, segment: GutSegment): boolean {
  return (ABSORPTION_SITES[nutrient][segment] ?? 0) > 0;
}

/**
 * How much of a site's normal uptake of a class is working right now, 0-1, read from the
 * model's own quantities rather than restated here.
 *
 * The engine has ONE mucosal surface number, so villous atrophy dims the duodenum and the ileum
 * alike. Real coeliac disease is proximal; the difference shows here only through the classes
 * that live there (iron, calcium, folate) and not through the site itself.
 */
export function siteFunction(
  nutrient: NutrientClass,
  segment: GutSegment,
  inputs: DigestionInputs,
  derived: DigestionDerived,
): number {
  if (!isSiteOf(nutrient, segment)) return 0;
  switch (nutrient) {
    case 'carbohydrate':
      // Brush-border hydrolases and salivary amylase cover a failed pancreas for starch, so
      // carbohydrate follows the surface and the contact time, not the enzymes.
      return clamp(derived.generalUptakeFraction, 0, 1);
    case 'protein':
      // Trypsin has no brush-border understudy: protein needs the pancreas as well as the wall.
      return clamp(derived.generalUptakeFraction * derived.enzymeFactor, 0, 1);
    case 'fat':
      return clamp(derived.currentMealFatAbsorptionPct / 100, 0, 1);
    case 'ironCalciumFolate':
      return clamp(ironSurfaceFactor(inputs.mucosalSurfaceAreaPct), 0, 1);
    case 'b12':
      return b12UptakeFraction(inputs.terminalIlealFunctionPct);
    case 'bileSalts':
      return clamp(inputs.ilealReabsorptionFraction, 0, 1);
    case 'waterSodium':
      // The colon's share is salvage, and salvage is poisoned by what spills into it; the small
      // bowel's is net absorption, which an active secretory drive turns into net secretion.
      if (segment === 'colon') return clamp(derived.colonicSalvageFraction, 0, 1);
      return clamp(1 - inputs.secretoryDrivePct / 100, 0, 1);
    case 'scfa':
      return clamp(inputs.colonicFunctionPct / 100, 0, 1);
    case 'alcohol':
      // The model carries no alcohol and no lever acts on it: this band is fixed on purpose, and
      // is here because "what does the stomach absorb?" is a question students are asked.
      return 1;
  }
}

/** Below this working fraction a site is drawn as lost rather than as merely reduced. */
export const SITE_LOST_BELOW = 0.25;

/** Net secretion rather than net absorption: the small bowel is pouring water in. */
export function smallBowelSecreting(inputs: DigestionInputs): boolean {
  return inputs.secretoryDrivePct >= 50;
}
