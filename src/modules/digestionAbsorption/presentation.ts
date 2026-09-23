import { clamp } from '@/shared/lib/math';
import { MICRONUTRIENT, WATER } from './engine/constants';
import type { DigestionDerived, DigestionHistoryPoint, DigestionInputs, DigestionInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const STOOL = { x: 440, y: 150, width: 70, height: 120 };
const STOOL_MAX_ML = 3000;

type Ctx = PresentationContext<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint>;

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
}

export function buildDigestionAbsorptionPresentation(ctx: Ctx): ModulePresentation<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint> {
  const { derived } = ctx;
  const lumenLoad = clamp(derived.luminalMealLoad, 0, 2);
  const stoolHeight = (clamp(derived.stoolWaterMlPerDay, 0, STOOL_MAX_ML) / STOOL_MAX_ML) * STOOL.height;
  const lumenWidth = 386 * clamp(lumenLoad / 1, 0.04, 1);
  const fringeWidth = 106 * clamp(derived.enzymeFactor * (derived.currentMealFatAbsorptionPct / 100) + 0.08, 0.06, 1);
  const enzymeWidth = 1 + 1.6 * clamp(derived.enzymeFactor, 0, 1);
  const bileWidth = 1 + 1.6 * clamp(derived.bileEmulsificationFactor, 0, 1);
  const ilealWidth = clamp(derived.spiltBileSaltsGPerDay > 0.05 ? 3 : 0.8, 0.5, 3);
  const diarrhoeaLineY = STOOL.y + STOOL.height - ((WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY / STOOL_MAX_ML) * STOOL.height);
  const fatToken = derived.faecalFatGPerDay >= 14 ? 'danger' : 'o2';
  const stoolToken = derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY ? 'danger' : 'text';
  const b12Token = derived.b12Deficient ? 'danger' : 'marrow';
  const ironToken = derived.ironDeficient ? 'danger' : 'iron';
  const nutritionToken = derived.nutritionIndex < 0.8 ? 'danger' : 'text';
  const alarm = derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY
    ? `${derived.stoolClassification} — ${derived.stoolWaterMlPerDay.toFixed(0)} ml/day${derived.stoolOsmoticGapHigh ? ' · osmotic gap high' : ''}`
    : null;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'The digestive chain from pancreas and liver to stool, showing the lumen filling with a meal, the absorbed fringe along the jejunum, bile and enzyme feeding the tube, ileal reclaim of bile salts, and the stool bucket filling with the day\'s water',
        children: [
          { type: 'text', x: 40, y: 54, text: 'The chain', cls: 'label' },
          /* The lactose in the meal, beside the chain that has to handle it.
           *
           * Lactose reaches `derived` as a passthrough nothing drew, so the slider that decides
           * whether a lactase-deficient gut has anything to fail on moved no picture. It is drawn
           * at the mouth end, because an unsplit disaccharide is a property of what was EATEN
           * before it is a property of what happens downstream. */
          { type: 'text', x: 440, y: 54, text: 'meal lactose', cls: 'caption' },
          { type: 'path', d: 'M440,64 h90', colorToken: 'text-faint', strokeWidth: 8, strokeLinecap: 'butt', fill: 'none', opacity: 0.25 },
          { type: 'path', d: `M440,64 h${(clamp(derived.mealLactoseGrams / 50, 0, 1) * 90).toFixed(1)}`, colorToken: 'glucose', strokeWidth: 8, strokeLinecap: 'butt', fill: 'none' },
          { type: 'text', x: 440, y: 86, text: `${derived.mealLactoseGrams.toFixed(0)} g`, cls: 'caption' },

          { type: 'path', d: rectPath(40, 64, 110, 70), fill: 'none', colorToken: 'text' },
          { type: 'path', d: rectPath(160, 64, 110, 70), fill: 'none', colorToken: 'text' },
          { type: 'path', d: rectPath(280, 64, 90, 70), fill: 'none', colorToken: 'text' },
          { type: 'path', d: rectPath(380, 64, 50, 70), fill: 'none', colorToken: 'text' },

          { type: 'rect', x: 42, y: 96, width: lumenWidth, height: 6, fill: 'gastrin' },
          { type: 'rect', x: 162, y: 128, width: fringeWidth, height: 4, fill: 'o2' },

          { type: 'text', x: 48, y: 82, text: 'duodenum', cls: 'caption' },
          { type: 'text', x: 172, y: 82, text: 'jejunum', cls: 'caption' },
          { type: 'text', x: 288, y: 82, text: 'ileum', cls: 'caption' },
          { type: 'text', x: 384, y: 82, text: 'colon', cls: 'caption' },

          { type: 'path', d: 'M 215 190 L 215 138', fill: 'none', colorToken: 'cck', strokeWidth: enzymeWidth },
          { type: 'text', x: 168, y: 206, text: `Pancreas · enzymes ${(derived.enzymeFactor * 100).toFixed(0)}%`, cls: 'label' },

          { type: 'path', d: 'M 100 250 C 100 200, 95 180, 95 136', fill: 'none', colorToken: 'liver', strokeWidth: bileWidth },
          { type: 'text', x: 40, y: 268, text: `Liver · pool ${derived.bileSaltPoolG.toFixed(1)} g · makes ${derived.hepaticSynthesisGPerDay.toFixed(1)} g/day`, cls: 'label' },

          { type: 'path', d: 'M 325 134 C 330 220, 240 240, 130 252', fill: 'none', colorToken: 'liver', strokeWidth: ilealWidth },
          { type: 'text', x: 268, y: 244, text: 'ileal reclaim', cls: 'caption' },

          { type: 'text', x: STOOL.x - 10, y: STOOL.y - 14, text: 'Stool', cls: 'label' },
          { type: 'path', d: rectPath(STOOL.x, STOOL.y, STOOL.width, STOOL.height), fill: 'none', colorToken: 'text' },
          { type: 'rect', x: STOOL.x + 1, y: STOOL.y + STOOL.height - stoolHeight, width: STOOL.width - 2, height: stoolHeight, fill: 'danger' },
          { type: 'line', x1: STOOL.x - 6, x2: STOOL.x + STOOL.width + 6, y1: diarrhoeaLineY, y2: diarrhoeaLineY, cls: 'axis' },
          { type: 'text', x: STOOL.x - 44, y: diarrhoeaLineY + 6, text: '200 ml', cls: 'caption' },
          { type: 'text', x: STOOL.x - 16, y: STOOL.y + STOOL.height + 18, text: `${derived.stoolWaterMlPerDay.toFixed(0)} ml/day`, cls: 'caption' },

          { type: 'text', x: 40, y: 310, text: `fat uptake ${derived.currentMealFatAbsorptionPct.toFixed(0)}% · faecal fat ${derived.faecalFatGPerDay.toFixed(1)} g/day · lactose ${derived.lactoseAbsorbedPct.toFixed(0)}%`, cls: 'caption' },
          { type: 'text', x: 40, y: 328, text: `B12 store ${(derived.b12StoreFraction * 100).toFixed(0)}% · iron store ${(derived.ironStoreFraction * 100).toFixed(0)}% · nutrition ${(derived.nutritionIndex * 100).toFixed(0)}%`, cls: 'caption' },
          ...(alarm ? [{ type: 'text' as const, x: 40, y: 350, text: alarm, cls: 'alarm' }] : []),
          { type: 'text', x: 40, y: 378, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 40, y: 398, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Fat content', key: 'mealFatGrams', min: 0, max: 80, step: 2, unit: ' g' },
      { kind: 'slider', label: 'Lactose content', key: 'mealLactoseGrams', min: 0, max: 50, step: 2, unit: ' g' },
      { kind: 'slider', label: 'Pancreatic enzymes', key: 'pancreaticEnzymeCapacityPct', min: 0, max: 100, step: 1, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Liver synthesis capacity', key: 'hepaticSynthesisCapacityPct', min: 0, max: 100, step: 5, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Ileal salt recycling', key: 'ilealReabsorptionFraction', min: 0, max: 1, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Mucosal surface area', key: 'mucosalSurfaceAreaPct', min: 0, max: 100, step: 2, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Terminal ileum function', key: 'terminalIlealFunctionPct', min: 0, max: 100, step: 2, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Lactase activity', key: 'lactaseActivityPct', min: 0, max: 100, step: 2, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Colonic function', key: 'colonicFunctionPct', min: 0, max: 100, step: 5, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Secretory drive', key: 'secretoryDrivePct', min: 0, max: 100, step: 5, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Transit speed', key: 'transitMultiplier', min: 0.5, max: 3, step: 0.1, unit: 'x' },
    ],
    readouts: [
      {
        label: 'Fat uptake',
        value: (c) => c.derived.currentMealFatAbsorptionPct.toFixed(0),
        unit: '%',
        secondary: (c) => `faecal fat ${c.derived.faecalFatGPerDay.toFixed(1)} g/day`,
        colorToken: fatToken,
      },
      {
        label: 'Bile salt pool',
        value: (c) => c.derived.bileSaltPoolG.toFixed(1),
        unit: 'g',
        secondary: (c) => `liver makes ${c.derived.hepaticSynthesisGPerDay.toFixed(1)} · spills ${c.derived.spiltBileSaltsGPerDay.toFixed(1)}`,
        colorToken: 'liver',
      },
      {
        label: 'Emulsification',
        value: (c) => (c.derived.bileEmulsificationFactor * 100).toFixed(0),
        unit: '%',
        secondary: () => 'detergent for the fat',
        colorToken: 'liver',
      },
      {
        label: 'Lactose uptake',
        value: (c) => c.derived.lactoseAbsorbedPct.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.unabsorbedLactoseGPerDay > 1 ? `${c.derived.unabsorbedLactoseGPerDay.toFixed(0)} g heading for the colon` : 'brush border coping'),
        colorToken: 'gastrin',
      },
      {
        label: 'Stool water',
        value: (c) => c.derived.stoolWaterMlPerDay.toFixed(0),
        unit: 'ml/day',
        secondary: (c) => c.derived.stoolClassification,
        colorToken: stoolToken,
      },
      {
        label: 'Osmotic gap',
        value: (c) => (c.derived.stoolOsmoticGapHigh ? 'high' : 'low'),
        secondary: (c) => (c.derived.stoolOsmoticGapHigh ? 'unabsorbed solute — stop the food' : 'electrolyte-driven or quiet'),
        colorToken: 'text',
      },
      {
        label: 'B12 store',
        value: (c) => (c.derived.b12StoreFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.b12Deficient ? 'deficient — ileal site lost' : 'replete'),
        colorToken: b12Token,
      },
      {
        label: 'Iron store',
        value: (c) => (c.derived.ironStoreFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.ironDeficient ? `deficient — <${MICRONUTRIENT.DEFICIENT_FRACTION * 100}%` : 'replete'),
        colorToken: ironToken,
      },
      {
        label: 'Nutrition',
        value: (c) => (c.derived.nutritionIndex * 100).toFixed(0),
        unit: '%',
        secondary: () => 'drifting toward what absorption delivers',
        colorToken: nutritionToken,
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Stool water',
        unit: 'ml/day',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 3000,
        data: (points) => points.map((p) => p.stoolWaterMlPerDay),
      },
      {
        kind: 'sparkline',
        label: 'Bile salt pool',
        unit: 'g',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 5,
        data: (points) => points.map((p) => p.bileSaltPoolG),
      },
      {
        kind: 'sparkline',
        label: 'Fat uptake',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.fatAbsorptionPct),
      },
      {
        kind: 'sparkline',
        label: 'Nutrition',
        unit: '%',
        colorToken: 'text',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.nutritionIndex * 100),
      },
    ],
  };
}
