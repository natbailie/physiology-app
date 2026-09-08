import { clamp } from '@/shared/lib/math';
import { LIVER_LEFT_LOBE_PATH, LIVER_RIGHT_LOBE_PATH, liverScene } from '@/shared/diagram/organShapes';
import { BILIRUBIN } from './engine/constants';
import type { LiverDerived, LiverHistoryPoint, LiverInputs, LiverInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint>;

const POOL_MAX = 400;

/** Where the liver sits. The bile duct and the conjugated fill are both anchored to it. */
const LIVER = { x: 278, y: 152 };
/** The liver's own vertical extent, which is what the conjugated pool fills from the bottom of. */
const LIVER_TOP = -46;
const LIVER_BOTTOM = 28;

/** Pool bar height scaled to the diagram's 110 px max, matching the legacy SVG. */
function poolHeight(umolL: number): number {
  return (clamp(umolL, 0, POOL_MAX) / POOL_MAX) * 110;
}

/** The same fraction, scaled to the height of the liver drawing rather than of a box. */
function liverFill(umolL: number): number {
  return (clamp(umolL, 0, POOL_MAX) / POOL_MAX) * (LIVER_BOTTOM - LIVER_TOP);
}

export function buildLiverPhysiologyPresentation(ctx: Ctx): ModulePresentation<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint> {
  const { derived } = ctx;

  const uncHeight = poolHeight(derived.unconjugatedUmolL);
  const stoolWidth = clamp(derived.stoolColourPct, 0, 100);
  const ductOpacity = (1 - derived.effectiveObstructionPct / 130).toFixed(2);
  const showObstruction = derived.effectiveObstructionPct > 20;

  const conjugatedFill = liverFill(derived.conjugatedUmolL);
  /* Injury pales the parenchyma and obstruction loads the biliary tree, so the two sliders that
   * matter most to this module are visible in the organ before they are read in a tile. */
  const liver = liverScene(LIVER, {
    functionLevel: clamp(1 - ctx.inputs.hepatocyteInjuryPct / 100, 0.2, 1),
    bileLoad: clamp(derived.effectiveObstructionPct / 100, 0, 1),
  });

  const children: SceneNode[] = [
    // --- Blood pool: unconjugated ---
    { type: 'path', d: 'M40,96 H110 V216 H40 Z', fill: 'none', colorToken: 'text', strokeWidth: 2.5 },
    {
      type: 'rect',
      x: 44,
      y: 212 - uncHeight,
      width: 62,
      height: uncHeight,
      fill: 'danger',
    },
    { type: 'text', x: 40, y: 86, text: 'Blood · unconjugated', cls: 'label' },
    {
      type: 'text',
      x: 42,
      y: 234,
      text: `${derived.unconjugatedUmolL.toFixed(0)} µmol/L`,
      cls: 'caption',
    },

    // --- Flow into liver ---
    { type: 'path', d: 'M 112 158 H 194', colorToken: 'liver', strokeWidth: 2.5 },
    { type: 'text', x: 128, y: 148, text: 'uptake', cls: 'caption' },

    // --- The liver, and the conjugated pool filling it ---
    liver.node,
    /* Conjugated bilirubin rises INSIDE the organ that conjugates it, clipped to the two lobes.
     * It was a rectangle inside an ellipse, which asked the reader to accept that the ellipse
     * was a liver before it could tell them anything about bilirubin. The clip resolves in the
     * group's own user space, which is why the rect and the clip path share the translate. */
    {
      type: 'group',
      transform: `translate(${LIVER.x}, ${LIVER.y})`,
      children: [
        {
          type: 'rect',
          x: -80,
          y: LIVER_BOTTOM - conjugatedFill,
          width: 162,
          height: conjugatedFill,
          fill: 'liver',
          fillOpacity: 0.55,
          clipPathId: 'liver-conjugated',
        },
      ],
    },
    { type: 'text', x: 206, y: 86, text: 'Liver · UGT conjugation', cls: 'label' },
    {
      type: 'text',
      x: 206,
      y: 244,
      text: `conj ${derived.conjugatedUmolL.toFixed(0)} µmol/L`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 206,
      y: 260,
      text: `ALT ×${derived.altXUlN.toFixed(1)} · ALP ×${derived.alpXUlN.toFixed(1)} · R ${derived.rFactor >= 60 ? '≥60' : derived.rFactor.toFixed(1)}`,
      cls: 'caption',
    },

    // --- The bile duct, leaving the porta hepatis for the gut ---
    {
      type: 'path',
      d: 'M 320 198 C 344 196 362 190 378 182',
      fill: 'none',
      colorToken: 'liver',
      strokeWidth: 2.5,
      styleVars: { 'duct-flow': parseFloat(ductOpacity) },
    },
    { type: 'text', x: 330, y: 216, text: 'bile duct', cls: 'caption' },
    ...(showObstruction
      ? [
          { type: 'line' as const, x1: 344, y1: 180, x2: 360, y2: 206, colorToken: 'danger' },
          { type: 'text' as const, x: 392, y: 214, text: `Obstructed ${derived.effectiveObstructionPct.toFixed(0)}%`, cls: 'alarm' },
        ]
      : []),

    // --- Gut: pigment arriving → stool colour + urobilinogen ---
    { type: 'path', d: 'M394,110 H534 V186 H394 Z', fill: 'none', colorToken: 'text', strokeWidth: 2.5 },
    {
      type: 'rect',
      x: 400,
      y: 174,
      width: (128 * stoolWidth) / 100,
      height: 6,
      fill: '#7a5a1e',
    },
    { type: 'text', x: 394, y: 100, text: 'Gut · pigment arriving', cls: 'label' },

    // --- Summary annotations ---
    {
      type: 'text',
      x: 40,
      y: 286,
      text: `stool colour ${derived.stoolColourPct.toFixed(0)}% · urobilinogen ${derived.urineUrobilinogenIndex.toFixed(0)}% of normal`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 40,
      y: 304,
      text: `total ${derived.totalBilirubinUmolL.toFixed(0)} µmol/L (${derived.fractionConjugatedPct.toFixed(0)}% conjugated)${derived.jaundiceVisible ? ' · jaundice visible' : ''}`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 40,
      y: 322,
      text: `urine: bilirubin ${derived.urineBilirubinPresent ? 'present' : 'absent'} · ammonia ${derived.ammoniaUmolL.toFixed(0)} µmol/L${derived.encephalopathyGrade > 0 ? ` · encephalopathy grade ${derived.encephalopathyGrade}` : ''}`,
      cls: 'caption',
    },
    ...(derived.kernicterusRiskPct > 30
      ? [{ type: 'text' as const, x: 40, y: 346, text: `Kernicterus risk ${derived.kernicterusRiskPct.toFixed(0)}% — unconjugated vs albumin binding`, cls: 'alarm' }]
      : []),
    { type: 'text', x: 40, y: 380, text: derived.classification, cls: 'verdict' },
    { type: 'text', x: 40, y: 402, text: derived.patternSummary, cls: 'label' },
  ];

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [26, 66, 552, 360],
        ariaLabel:
          'Bilirubin pathway: an unconjugated blood pool taken up into the liver — right and left lobes, falciform ligament, gallbladder and portal triad — where the conjugated pool fills the parenchyma, then out along the bile duct to the gut',
        defs: [
          {
            type: 'clipPath',
            id: 'liver-conjugated',
            children: [
              { type: 'path', d: LIVER_RIGHT_LOBE_PATH },
              { type: 'path', d: LIVER_LEFT_LOBE_PATH },
            ],
          },
          ...liver.defs,
        ],
        children,
      },
    ],
    controls: [
      { kind: 'slider', label: 'Haemolysis', key: 'haemolysisMultiplier', min: 1, max: 8, step: 0.1, unit: '× normal' },
      { kind: 'slider', label: 'UGT (conjugation) activity', key: 'ugtActivity', min: 0, max: 1, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Hepatocyte excretion', key: 'hepatocyteExcretionPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Acute hepatocyte injury', key: 'hepatocyteInjuryPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Bile duct obstruction', key: 'biliaryObstructionPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Albumin', key: 'albuminGPerL', min: 20, max: 50, step: 1, unit: ' g/L' },
    ],
    readouts: [
      {
        label: 'Unconjugated',
        value: (c) => c.derived.unconjugatedUmolL.toFixed(0),
        unit: 'µmol/L',
        secondary: () => 'albumin-bound — never enters urine',
        colorToken: 'danger',
      },
      {
        label: 'Conjugated',
        value: (c) => c.derived.conjugatedUmolL.toFixed(0),
        unit: 'µmol/L',
        secondary: () => 'water-soluble — spills into urine past threshold',
        colorToken: 'liver',
      },
      {
        label: 'Total bilirubin',
        value: (c) => c.derived.totalBilirubinUmolL.toFixed(0),
        unit: 'µmol/L',
        secondary: (c) =>
          c.derived.jaundiceVisible
            ? `visible (>${BILIRUBIN.JAUNDICE_VISIBLE_UMOL_L})`
            : `normal <${BILIRUBIN.NORMAL_TOTAL_UMOL_L}`,
        colorToken: 'warn',
      },
      {
        label: 'Conjugated fraction',
        value: (c) => c.derived.fractionConjugatedPct.toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.fractionConjugatedPct > 55
            ? 'obstructive picture'
            : c.derived.fractionConjugatedPct < 25
              ? 'pre-hepatic picture'
              : 'mixed',
        colorToken: 'text',
      },
      {
        label: 'Urine bilirubin',
        value: (c) => (c.derived.urineBilirubinPresent ? 'present' : 'absent'),
        secondary: (c) =>
          c.derived.urineBilirubinPresent
            ? 'conjugated pigment reaching urine'
            : 'rules out cholestasis as cause of deep jaundice',
        colorToken: 'liver',
      },
      {
        label: 'Urine urobilinogen',
        value: (c) => `${c.derived.urineUrobilinogenIndex.toFixed(0)}%`,
        secondary: (c) =>
          c.derived.urineUrobilinogenIndex > 180
            ? 'High — haemolytic load'
            : c.derived.urineUrobilinogenIndex < 30
              ? 'Absent — bile never reached gut'
              : 'normal',
        colorToken: 'o2',
      },
      {
        label: 'Stool colour',
        value: (c) => c.derived.stoolColourPct.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.stoolColourPct < 30 ? 'pale — acholic' : 'pigmented'),
        colorToken: 'interstitium',
      },
      {
        label: 'ALT / ALP',
        value: (c) => `×${c.derived.altXUlN.toFixed(1)} / ×${c.derived.alpXUlN.toFixed(1)}`,
        secondary: (c) =>
          `${c.derived.lftPattern} pattern · R ${c.derived.rFactor >= 60 ? '≥60' : c.derived.rFactor.toFixed(1)}`,
        colorToken: 'nociception',
      },
      {
        label: 'Ammonia',
        value: (c) => c.derived.ammoniaUmolL.toFixed(0),
        unit: 'µmol/L',
        secondary: (c) =>
          c.derived.encephalopathyGrade > 0
            ? `encephalopathy grade ${c.derived.encephalopathyGrade}`
            : 'cleared normally',
        colorToken: 'danger',
      },
      {
        label: 'Kernicterus risk',
        value: (c) => c.derived.kernicterusRiskPct.toFixed(0),
        unit: '%',
        secondary: (c) => `unbound fraction vs albumin ${c.derived.albuminGPerL.toFixed(0)} g/L`,
        colorToken: 'danger',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        wide: true,
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Total bilirubin',
        unit: 'µmol/L',
        colorToken: 'warn',
        domainMin: 0,
        domainMax: 400,
        data: (points) => points.map((p) => p.total),
      },
      {
        kind: 'sparkline',
        label: 'Unconjugated',
        unit: 'µmol/L',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 300,
        data: (points) => points.map((p) => p.unconjugated),
      },
      {
        kind: 'sparkline',
        label: 'Conjugated',
        unit: 'µmol/L',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 300,
        data: (points) => points.map((p) => p.conjugated),
      },
      {
        kind: 'sparkline',
        label: 'Ammonia',
        unit: 'µmol/L',
        colorToken: 'nociception',
        domainMin: 0,
        domainMax: 220,
        data: (points) => points.map((p) => p.ammonia),
      },
    ],
  };
}
