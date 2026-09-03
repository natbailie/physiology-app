import { clamp } from '@/shared/lib/math';
import { BILIRUBIN } from './engine/constants';
import type { LiverDerived, LiverHistoryPoint, LiverInputs, LiverInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint>;

const POOL_MAX = 400;

/** Pool bar height scaled to the diagram's 110 px max, matching the legacy SVG. */
function poolHeight(umolL: number): number {
  return (clamp(umolL, 0, POOL_MAX) / POOL_MAX) * 110;
}

export function buildLiverPhysiologyPresentation(ctx: Ctx): ModulePresentation<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint> {
  const { derived } = ctx;

  const uncHeight = poolHeight(derived.unconjugatedUmolL);
  const conjHeight = poolHeight(derived.conjugatedUmolL);
  const stoolWidth = clamp(derived.stoolColourPct, 0, 100);
  const ductOpacity = (1 - derived.effectiveObstructionPct / 130).toFixed(2);
  const showObstruction = derived.effectiveObstructionPct > 20;

  const children: SceneNode[] = [
    // --- Blood pool: unconjugated ---
    { type: 'path', d: 'M50,90 H120 V210 H50 Z', fill: 'none', colorToken: 'text', strokeWidth: 2.5 },
    {
      type: 'rect',
      x: 54,
      y: 206 - uncHeight,
      width: 62,
      height: uncHeight,
      fill: 'danger',
    },
    { type: 'text', x: 46, y: 78, text: 'Blood · unconjugated', cls: 'label' },
    {
      type: 'text',
      x: 52,
      y: 228,
      text: `${derived.unconjugatedUmolL.toFixed(0)} µmol/L`,
      cls: 'caption',
    },

    // --- Flow into liver ---
    { type: 'path', d: 'M 122 150 H 168', colorToken: 'liver', strokeWidth: 2.5 },
    { type: 'text', x: 118, y: 140, text: 'uptake', cls: 'caption' },

    // --- Hepatocyte: conjugation + excretion capacity ---
    // Ellipse drawn as a path since the schema has no EllipseNode.
    {
      type: 'path',
      d: 'M230,106 C262,106 288,125 288,150 C288,175 262,194 230,194 C198,194 172,175 172,150 C172,125 198,106 230,106Z',
      fill: 'none',
      colorToken: 'text',
      strokeWidth: 2.5,
    },
    {
      type: 'rect',
      x: 196,
      y: 162 - conjHeight / 2.2,
      width: 68,
      height: conjHeight / 1.1,
      fill: 'liver',
    },
    { type: 'text', x: 192, y: 96, text: 'Liver · UGT', cls: 'label' },
    {
      type: 'text',
      x: 188,
      y: 210,
      text: `conj ${derived.conjugatedUmolL.toFixed(0)} µmol/L`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 186,
      y: 228,
      text: `ALT ×${derived.altXUlN.toFixed(1)} · ALP ×${derived.alpXUlN.toFixed(1)} · R ${derived.rFactor >= 60 ? '≥60' : derived.rFactor.toFixed(1)}`,
      cls: 'caption',
    },

    // --- Duct: blocked marker when obstructed ---
    {
      type: 'path',
      d: 'M 290 150 H 356',
      colorToken: 'liver',
      strokeWidth: 2.5,
      styleVars: { 'duct-flow': parseFloat(ductOpacity) },
    },
    { type: 'text', x: 292, y: 140, text: 'bile duct', cls: 'caption' },
    ...(showObstruction
      ? [
          { type: 'line' as const, x1: 312, y1: 136, x2: 332, y2: 164, colorToken: 'danger' },
          { type: 'text' as const, x: 300, y: 126, text: `Obstructed ${derived.effectiveObstructionPct.toFixed(0)}%`, cls: 'alarm' },
        ]
      : []),

    // --- Gut: pigment arriving → stool colour + urobilinogen ---
    { type: 'path', d: 'M360,112 H520 V188 H360 Z', fill: 'none', colorToken: 'text', strokeWidth: 2.5 },
    {
      type: 'rect',
      x: 366,
      y: 176,
      width: (148 * stoolWidth) / 100,
      height: 6,
      fill: '#7a5a1e',
    },
    { type: 'text', x: 368, y: 104, text: 'GUT → STOOL & UROBILINOGEN', cls: 'label' },

    // --- Summary annotations ---
    {
      type: 'text',
      x: 40,
      y: 246,
      text: `stool colour ${derived.stoolColourPct.toFixed(0)}% · urobilinogen ${derived.urineUrobilinogenIndex.toFixed(0)}% of normal`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 40,
      y: 262,
      text: `total ${derived.totalBilirubinUmolL.toFixed(0)} µmol/L (${derived.fractionConjugatedPct.toFixed(0)}% conjugated)${derived.jaundiceVisible ? ' · jaundice visible' : ''}`,
      cls: 'caption',
    },
    {
      type: 'text',
      x: 40,
      y: 296,
      text: `urine: bilirubin ${derived.urineBilirubinPresent ? 'present' : 'absent'} · ammonia ${derived.ammoniaUmolL.toFixed(0)} µmol/L${derived.encephalopathyGrade > 0 ? ` · encephalopathy grade ${derived.encephalopathyGrade}` : ''}`,
      cls: 'caption',
    },
    ...(derived.kernicterusRiskPct > 30
      ? [{ type: 'text' as const, x: 40, y: 330, text: `Kernicterus risk ${derived.kernicterusRiskPct.toFixed(0)}% — unconjugated vs albumin binding`, cls: 'alarm' }]
      : []),
    { type: 'text', x: 40, y: 364, text: derived.classification, cls: 'verdict' },
    { type: 'text', x: 40, y: 386, text: derived.patternSummary, cls: 'label' },
  ];

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Bilirubin pathway with pools and flow',
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
