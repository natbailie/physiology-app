import { clamp } from '@/shared/lib/math';
import { ISCHAEMIA } from './engine/constants';
import type { CoronaryDerived, CoronaryHistoryPoint, CoronaryInputs, CoronaryInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint>;

// ── Static geometry (from CoronaryDiagram.tsx) ──────────────────────────

const HEART = { cx: 150, cy: 212, epi: 88, endo: 67, cavity: 46 };
const ARTERY_R = 100;
const RAD = Math.PI / 180;

function onCircle(degrees: number, radius: number): { x: number; y: number } {
  return {
    x: HEART.cx + radius * Math.cos(degrees * RAD),
    y: HEART.cy + radius * Math.sin(degrees * RAD),
  };
}

function arteryArc(fromDeg: number, toDeg: number): string {
  const a = onCircle(fromDeg, ARTERY_R);
  const b = onCircle(toDeg, ARTERY_R);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${ARTERY_R} ${ARTERY_R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

const LESION_FROM = 250;
const LESION_TO = 290;
const PENETRATORS = [210, 230, 270, 310, 330] as const;
const CYCLE = { x: 300, y: 96, width: 240, height: 16 };

const ARTERY_WALL_PATH = arteryArc(200, 340);
const ARTERY_LUMEN_PRE = arteryArc(200, LESION_FROM);
const ARTERY_LUMEN_POST = arteryArc(LESION_TO, 340);
const LESION_ARC = arteryArc(LESION_FROM, LESION_TO);

const PENETRATOR_GEOMETRY = PENETRATORS.map((angle) => {
  const outer = onCircle(angle, ARTERY_R - 4);
  const inner = onCircle(angle, HEART.cavity + 4);
  return {
    angle,
    d: `M ${outer.x.toFixed(1)} ${outer.y.toFixed(1)} L ${inner.x.toFixed(1)} ${inner.y.toFixed(1)}`,
    downstream: angle > LESION_FROM && angle < LESION_TO,
  };
});

const COLLATERAL_PATH = 'M 119.9 121.9 Q 150 60 180.1 121.9';
const LEADER_PATH = 'M 96 132 L 74 162';

// ── Helpers ─────────────────────────────────────────────────────────────

function reserveVerdict(ratio: number): string {
  if (ratio < 1) return 'exhausted';
  if (ratio < 2) return 'critically low';
  if (ratio < 3.5) return 'reduced';
  return 'healthy';
}

// ── Builder ─────────────────────────────────────────────────────────────

export function buildCoronaryCirculationPresentation(ctx: Ctx): ModulePresentation<CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint> {
  const { derived } = ctx;

  const lumenFraction = clamp(1 - derived.stenosisEffectiveFraction, 0.02, 1);
  const diastoleWidth = CYCLE.width * clamp(derived.diastolicTimeFraction, 0.05, 0.95);
  const systoleWidth = CYCLE.width - diastoleWidth;

  const epiFill = derived.transmuralInjuryActive ? 'danger' : 'artery';
  const endoFill = (derived.anginaActive || derived.transmuralInjuryActive) ? 'danger' : 'artery';

  const lesionLabel = onCircle((LESION_FROM + LESION_TO) / 2, ARTERY_R);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Left ventricle in cross-section with its epicardial artery, the lesion, and the two layers of wall it supplies',
        children: [
          // ── Ventricular wall, two layers ──
          { type: 'circle', cx: HEART.cx, cy: HEART.cy, r: HEART.epi, fill: epiFill },
          { type: 'circle', cx: HEART.cx, cy: HEART.cy, r: HEART.endo, fill: endoFill },
          { type: 'circle', cx: HEART.cx, cy: HEART.cy, r: HEART.cavity, fill: 'panel-raised' },

          { type: 'text', x: HEART.cx, y: HEART.cy - 2, text: 'LV', cls: 'anatomy', anchor: 'middle' },
          { type: 'text', x: HEART.cx, y: HEART.cy + 16, text: `${derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)} mmHg`, cls: 'tickLabel', anchor: 'middle' },

          // ── Penetrating branches ──
          ...PENETRATOR_GEOMETRY.map((p) => ({
            type: 'path' as const,
            d: p.d,
            colorToken: 'artery',
            strokeWidth: p.downstream ? Math.max(0.6, 0.8 + lumenFraction * 2.6) : 3,
            styleVars: p.downstream ? { lumen: lumenFraction } : undefined,
          })),

          // ── Epicardial artery ──
          { type: 'path', d: ARTERY_WALL_PATH, colorToken: 'text', strokeWidth: 12 },
          { type: 'path', d: ARTERY_LUMEN_PRE, colorToken: 'artery', strokeWidth: 8 },
          { type: 'path', d: ARTERY_LUMEN_POST, colorToken: 'artery', strokeWidth: 8 },
          { type: 'path', d: LESION_ARC, colorToken: 'artery', strokeWidth: Math.max(0.6, 8 * lumenFraction) },

          // ── Collaterals (conditional) ──
          ...(derived.collateralFraction > 0.08
            ? [
                { type: 'path' as const, d: COLLATERAL_PATH, colorToken: 'o2', strokeWidth: 3 },
                { type: 'text' as const, x: 150, y: 56, text: 'collaterals', cls: 'anatomy', anchor: 'middle' as const },
              ]
            : []),

          // Lesion label
          { type: 'text', x: lesionLabel.x, y: lesionLabel.y - 14, text: `lesion · ${(lumenFraction * 100).toFixed(0)}% lumen`, cls: 'anatomy', anchor: 'middle' },

          // Epicardial artery label with leader
          { type: 'path', d: LEADER_PATH, colorToken: 'text', strokeWidth: 1 },
          { type: 'text', x: 30, y: 128, text: 'Epicardial artery', cls: 'anatomy' },

          // ── Layer legend ──
          { type: 'rect', x: 30, y: 330, width: 12, height: 12, fill: epiFill },
          { type: 'text', x: 50, y: 340, text: 'Subepicardium — outer wall', cls: 'anatomy' },
          { type: 'rect', x: 30, y: 352, width: 12, height: 12, fill: endoFill },
          { type: 'text', x: 50, y: 362, text: 'Subendocardium — perfused last, in diastole only', cls: 'anatomy' },

          // ── Cardiac cycle bar ──
          { type: 'text', x: CYCLE.x, y: CYCLE.y - 12, text: 'One cardiac cycle', cls: 'label' },
          { type: 'rect', x: CYCLE.x, y: CYCLE.y, width: systoleWidth, height: CYCLE.height, fill: 'panel-raised' },
          { type: 'rect', x: CYCLE.x + systoleWidth, y: CYCLE.y, width: diastoleWidth, height: CYCLE.height, fill: 'artery' },
          { type: 'text', x: CYCLE.x + systoleWidth / 2, y: CYCLE.y + CYCLE.height + 14, text: 'systole', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: CYCLE.x + systoleWidth + diastoleWidth / 2, y: CYCLE.y + CYCLE.height + 14, text: 'diastole', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: CYCLE.x + systoleWidth + diastoleWidth / 2, y: CYCLE.y + CYCLE.height + 30, text: 'the wall is perfused here', cls: 'anatomy', anchor: 'middle' },
          { type: 'text', x: CYCLE.x, y: CYCLE.y + CYCLE.height + 52, text: `${derived.effectiveHeartRateBpm.toFixed(0)} bpm · diastole ${(derived.diastolicTimeFraction * 100).toFixed(0)}% of the cycle`, cls: 'caption' },

          // ── Perfusion head ──
          { type: 'text', x: CYCLE.x, y: 214, text: 'Perfusion head', cls: 'label' },
          { type: 'text', x: CYCLE.x, y: 234, text: `aortic diastolic ${derived.effectiveDiastolicPressureMmHg.toFixed(0)}`, cls: 'caption' },
          { type: 'text', x: CYCLE.x, y: 250, text: `− ventricular ${derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)}`, cls: 'caption' },
          { type: 'line', x1: CYCLE.x, y1: 258, x2: CYCLE.x + 150, y2: 258, cls: 'axis' },
          { type: 'text', x: CYCLE.x, y: 278, text: `${derived.drivingPressureMmHg.toFixed(0)} mmHg`, cls: 'valueLabel' },

          { type: 'text', x: CYCLE.x, y: 310, text: `reserve ×${derived.flowReserveRatio.toFixed(1)} · demand ×${derived.requiredFlow.toFixed(2)} · carriage ${(derived.oxygenCarriageRatio * 100).toFixed(0)}%`, cls: 'caption' },

          // ── Consequence ──
          ...(derived.anginaActive
            ? [{ type: 'text' as const, x: 300, y: 340, text: `angina — supply short of demand by ${(derived.ischaemiaLevel * 100).toFixed(0)}%`, cls: 'alarm' }]
            : []),
          ...(derived.transmuralInjuryActive
            ? [{ type: 'text' as const, x: 300, y: 358, text: 'vessel occluded — full wall thickness at risk', cls: 'alarm' }]
            : []),

          // ── Verdict ──
          { type: 'text', x: 30, y: 396, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 30, y: 418, text: derived.patternSummary, cls: 'label' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Heart rate', key: 'heartRateBpm', min: 40, max: 180, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'Systolic pressure', key: 'aorticSystolicPressureMmHg', min: 70, max: 210, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'Diastolic pressure', key: 'aorticDiastolicPressureMmHg', min: 30, max: 130, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'End-diastolic volume', key: 'endDiastolicVolumeMl', min: 50, max: 280, step: 5, unit: ' mL' },
      { kind: 'slider', label: 'Contractility', key: 'contractilityFraction', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Stenosis (diameter)', key: 'stenosisPercentDiameter', min: 0, max: 98, step: 1, unit: '%' },
      { kind: 'slider', label: 'Constrictor tone', key: 'coronaryTonePercent', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Collaterals', key: 'collateralFraction', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Haemoglobin', key: 'haemoglobinGPerDl', min: 4, max: 18, step: 0.5, unit: ' g/dL' },
      { kind: 'slider', label: 'Oxygen saturation', key: 'arterialOxygenSaturationPct', min: 70, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Nitrates', key: 'nitrateDosePercent', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Beta-blocker', key: 'betaBlockerDosePercent', min: 0, max: 100, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'Flow reserve',
        value: (c) => `×${c.derived.flowReserveRatio.toFixed(1)}`,
        secondary: (c) => reserveVerdict(c.derived.flowReserveRatio),
        colorToken: derived.flowReserveRatio < 2 ? 'danger' : 'o2',
      },
      {
        label: 'Demand',
        value: (c) => `×${c.derived.requiredFlow.toFixed(2)}`,
        unit: 'rest',
        secondary: (c) => `RPP ${(c.derived.ratePressureProduct / 1000).toFixed(1)}k`,
        colorToken: 'danger',
      },
      {
        label: 'Maximal supply',
        value: (c) => `×${c.derived.maximalFlowCapacity.toFixed(2)}`,
        unit: 'rest',
        secondary: (c) => `carriage ${(c.derived.oxygenCarriageRatio * 100).toFixed(0)}%`,
        colorToken: 'o2',
      },
      {
        label: 'Ischaemia',
        value: (c) => `${(c.derived.ischaemiaLevel * 100).toFixed(0)}%`,
        secondary: (c) =>
          c.derived.transmuralInjuryActive
            ? 'transmural'
            : c.derived.ischaemiaLevel >= ISCHAEMIA.GAP_ONSET
              ? 'subendocardial first'
              : 'none',
        colorToken: derived.anginaActive ? 'danger' : 'text',
      },
      {
        label: 'Diastolic window',
        value: (c) => `${(c.derived.diastolicTimeFraction * 100).toFixed(0)}%`,
        secondary: (c) => `systole ${c.derived.systolicDurationSeconds.toFixed(2)} s at ${c.derived.effectiveHeartRateBpm.toFixed(0)} bpm`,
        colorToken: 'artery',
      },
      {
        label: 'Driving head',
        value: (c) => c.derived.drivingPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => `closing ${c.derived.closingPressureMmHg.toFixed(0)}`,
        colorToken: 'artery',
      },
      {
        label: 'Wall stress',
        value: (c) => `×${c.derived.wallStressIndex.toFixed(2)}`,
        secondary: (c) => `LVEDP ${c.derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)} mmHg`,
        colorToken: 'text',
      },
      {
        label: 'Lesion',
        value: (c) => `${(c.derived.stenosisEffectiveFraction * 100).toFixed(0)}%`,
        secondary: (c) => c.derived.collateralFraction > 0.08 ? `collaterals ${(c.derived.collateralFraction * 100).toFixed(0)}%` : 'no collaterals',
        colorToken: 'danger',
      },
      {
        label: 'Functional contractility',
        value: (c) => `×${c.derived.functionalContractility.toFixed(2)}`,
        secondary: (c) =>
          c.derived.functionalContractility < c.derived.effectiveContractilityFraction * 0.95
            ? 'depressed by ischaemia'
            : undefined,
        colorToken: 'text',
      },
      {
        label: 'Infarcted territory',
        value: (c) => `${c.derived.necrosisLoadPct.toFixed(1)}%`,
        secondary: (c) => c.derived.necrosisLoadPct > 0.5 ? 'does not grow back' : undefined,
        colorToken: derived.necrosisLoadPct > 0 ? 'danger' : 'text',
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
        label: 'Maximal supply',
        secondaryLabel: 'demand',
        unit: '× rest',
        colorToken: 'o2',
        secondaryColorToken: 'danger',
        domainMin: 0,
        domainMax: 5,
        data: (points) => points.map((p) => p.maximalFlowCapacity),
        secondaryData: (points) => points.map((p) => p.requiredFlow),
      },
      {
        kind: 'sparkline',
        label: 'Ischaemia',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.ischaemiaLevel * 100),
      },
      {
        kind: 'sparkline',
        label: 'Diastolic window',
        unit: '%',
        colorToken: 'artery',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.diastolicTimeFraction * 100),
      },
    ],
  };
}
