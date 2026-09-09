import { clamp } from '@/shared/lib/math';
import { LABOUR } from './engine/constants';
import type { PregnancyDerived, PregnancyHistoryPoint, PregnancyInputs, PregnancyInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const PLOT = { x: 320, y: 56, width: 210, height: 150 };
const MAX_WEEKS = 42;
const MAX_HB = 15;
const MIN_HB = 9;

const toX = (weeks: number) => PLOT.x + (clamp(weeks, 4, MAX_WEEKS) / MAX_WEEKS) * PLOT.width;
const toY = (hb: number) =>
  PLOT.y + PLOT.height - ((clamp(hb, MIN_HB, MAX_HB) - MIN_HB) / (MAX_HB - MIN_HB)) * PLOT.height;

/** The maternal haemoglobin dilution curve for a baseline Hb of 13.5: plasma volume outpaces
 * red-cell mass, so Hb falls through the second trimester and troughs before term. */
function hbCurvePath(): string {
  const points: string[] = [];
  for (let w = 4; w <= MAX_WEEKS; w += 1) {
    const t = (w - 4) / 34;
    const progress = t * t * (3 - 2 * t) * 0.9 + t * 0.1;
    const pvInc = 45 * progress;
    const rcmInc = 25 * progress;
    const hb = (13.5 * (1 + rcmInc / 100)) / (1 + pvInc / 100);
    points.push(`${w === 4 ? 'M' : 'L'}${toX(w).toFixed(1)},${toY(hb).toFixed(1)}`);
  }
  return points.join(' ');
}

type Ctx = PresentationContext<PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint>;

export function buildPregnancyPresentation(ctx: Ctx): ModulePresentation<PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint> {
  const { derived } = ctx;
  const fetusRadius = 8 + (clamp(derived.fetalWeightG, 0, 4000) / 4000) * 26;
  const inLabour = derived.cervicalDilationCm > 0;
  // The Ferguson reflex is a positive feedback loop: oxytocin released by the cervix feeds back
  // to push the uterus harder, so the loop's activation tracks how far labour has got.
  const labourFeedback = clamp(derived.oxytocinRelative / LABOUR.LET_DOWN_OXYTOCIN_SPIKE, 0, 1);
  const opX = toX(derived.pregnancyProgressFraction * 38 + 4);
  const opY = toY(derived.haemoglobinGPerDl);
  const defs = inLabour
    ? [{ type: 'marker' as const, id: 'labour-arrow', colorToken: 'nociception' }]
    : [];

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 400],
        ariaLabel: 'Maternal haemoglobin dilution curve, fetal growth and contractions',
        defs,
        children: [
          // The Hb-vs-gestation dilution curve with its operating point.
          { type: 'rect', x: PLOT.x, y: PLOT.y, width: PLOT.width, height: PLOT.height, cls: 'axis' },
          {
            type: 'path',
            d: hbCurvePath(),
            colorToken: 'hemoglobin',
            strokeWidth: 2,
            fill: 'none',
          },
          { type: 'circle', cx: opX, cy: opY, r: 5, fill: 'placenta' },
          { type: 'text', x: PLOT.x, y: PLOT.y - 12, text: 'Maternal Hb vs gestation', cls: 'label' },
          {
            type: 'text',
            x: PLOT.x + 6,
            y: PLOT.y + 16,
            text: `${derived.haemoglobinGPerDl.toFixed(1)} g/dL — dilutional trough`,
            cls: 'caption',
          },
          { type: 'text', x: PLOT.x, y: PLOT.y + PLOT.height + 16, text: 'weeks →', cls: 'caption' },

          // Uterus with the fetus drawn to its estimated weight, and the placenta feeding it.
          {
            type: 'group',
            children: [
              {
                type: 'path',
                d: 'M140,38 C98,52 62,86 62,132 C62,196 104,220 140,222 C176,220 218,196 218,132 C218,86 182,52 140,38',
                cls: 'wombOutline',
                fill: 'none',
                strokeWidth: 2.5,
              },
              // Placenta: the interface that fails in pre-eclampsia/IUGR, sized to placental
              // function so a failing placenta visibly shrinks.
              {
                type: 'path',
                d: 'M118,58 C112,34 168,34 162,58 C150,72 130,72 118,58',
                fill: 'placenta',
                opacity: 0.35,
              },
              { type: 'circle', cx: 140, cy: 126, r: fetusRadius, fill: 'placenta', opacity: 0.35 },
            ],
          },
          { type: 'text', x: 86, y: 24, text: `Fetus · ${derived.fetalWeightG.toFixed(0)} g`, cls: 'label' },
          {
            type: 'text',
            x: 80,
            y: 238,
            text: `placental flow ${derived.uteroplacentalFlowSharePct.toFixed(0)}% of CO`,
            cls: 'caption',
          },

          // Contraction trace during labour.
          { type: 'line', x1: 40, x2: 280, y1: 300, y2: 300, cls: 'axis' },
          { type: 'text', x: 40, y: 282, text: 'Contractions', cls: 'label' },
          ...(inLabour
            ? [
                {
                  type: 'path' as const,
                  d: `M40,300 ${[0, 1, 2]
                    .map((i) => `q 20 -${18 + i * 8} 40 0 q 14 -10 28 0`)
                    .join(' ')}`,
                  colorToken: 'nociception',
                  strokeWidth: 2,
                  fill: 'none',
                },
                {
                  type: 'axis' as const,
                  path: 'M300,178 C330,240 320,270 300,288',
                  activation: labourFeedback,
                  colorToken: 'nociception',
                  label: 'Oxytocin → contraction',
                  labelX: 330,
                  labelY: 244,
                  markerId: 'labour-arrow',
                },
                {
                  type: 'text' as const,
                  x: 180,
                  y: 316,
                  text: `cervix ${derived.cervicalDilationCm.toFixed(1)} cm · oxytocin ${derived.oxytocinRelative.toFixed(0)}`,
                  cls: 'alarm',
                },
              ]
            : []),

          {
            type: 'text',
            x: 40,
            y: 344,
            text: `CO +${derived.cardiacOutputIncreasePct.toFixed(0)}% · SVR ${derived.svrChangePct >= 0 ? '+' : ''}${derived.svrChangePct.toFixed(0)}% · MAP ${derived.meanArterialPressureMmHg.toFixed(0)} · PaCO2 ${derived.paCO2MmHg.toFixed(0)} · creat ${derived.creatinineMgDl.toFixed(2)}`,
            cls: 'caption',
          },
          {
            type: 'text',
            x: 40,
            y: 360,
            text: `progesterone ${derived.progesteroneNgMl.toFixed(0)} · prolactin ${derived.prolactinNgMl.toFixed(0)} ng/mL · milk ${derived.milkSupplyMlPerDay.toFixed(0)} mL/day`,
            cls: 'caption',
          },
          { type: 'text', x: 40, y: 380, text: derived.classification, cls: 'verdict' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Gestational age', key: 'gestationalWeeks', min: 4, max: 42, step: 1, unit: ' weeks' },
      { kind: 'slider', label: 'Twin gestation', key: 'twinGestation', min: 0, max: 1, step: 1, unit: '%' },
      { kind: 'slider', label: 'Placental function', key: 'placentalFunctionPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Delivered (puerperium)', key: 'deliveredMode', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Suckling frequency', key: 'sucklingDrivePct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Pre-pregnancy Hb', key: 'baselineHaemoglobinGPerDl', min: 9, max: 15, step: 0.1, unit: ' g/dL' },
    ],
    readouts: [
      {
        label: 'Haemoglobin',
        value: (c) => c.derived.haemoglobinGPerDl.toFixed(1),
        unit: 'g/dL',
        secondary: (c) => `dilution: plasma +${c.derived.plasmaVolIncreasePct.toFixed(0)}% vs red cells +${c.derived.redCellMassIncreasePct.toFixed(0)}%`,
        colorToken: 'hemoglobin',
      },
      {
        label: 'Cardiac output',
        value: (c) => `+${c.derived.cardiacOutputIncreasePct.toFixed(0)}`,
        unit: '%',
        secondary: () => 'peaks by the late second trimester',
        colorToken: 'artery',
      },
      {
        label: 'SVR',
        value: (c) => `${c.derived.svrChangePct >= 0 ? '+' : ''}${c.derived.svrChangePct.toFixed(0)}`,
        unit: '%',
        secondary: (c) => (c.derived.svrChangePct > 5 ? 'Gestational vasodilatation reversed' : 'physiological fall'),
        colorToken: 'danger',
      },
      {
        label: 'MAP',
        value: (c) => c.derived.meanArterialPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => (c.derived.meanArterialPressureMmHg > 95 ? 'raised — placental axis failing' : 'mid-trimester dip is normal'),
        colorToken: 'danger',
      },
      {
        label: 'PaCO2',
        value: (c) => c.derived.paCO2MmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => `compensated (HCO3 ${c.derived.bicarbonateMmolL.toFixed(1)}, pH ${c.derived.phArterial.toFixed(3)})`,
        colorToken: 'co2',
      },
      {
        label: 'Creatinine',
        value: (c) => c.derived.creatinineMgDl.toFixed(2),
        unit: 'mg/dL',
        secondary: (c) => `GFR +${c.derived.gfrIncreasePct.toFixed(0)}% — a non-pregnant value here means injury`,
        colorToken: 'tubule',
      },
      {
        label: 'Serum sodium',
        value: (c) => c.derived.serumSodiumMmolL.toFixed(1),
        unit: 'mmol/L',
        secondary: () => 'osmostat reset downward',
        colorToken: 'sodium',
      },
      {
        label: 'Fetal weight',
        value: (c) => c.derived.fetalWeightG.toFixed(0),
        unit: 'g',
        secondary: (c) => (c.derived.fetalWeightG < 2200 && c.derived.pregnancyProgressFraction > 0.75 ? 'small for gestation' : 'along the growth curve'),
        colorToken: 'placenta',
      },
      {
        label: 'Progesterone',
        value: (c) => c.derived.progesteroneNgMl.toFixed(0),
        unit: 'ng/mL',
        secondary: (c) => (c.derived.deliveredEffective ? 'withdrawn — lactogenesis unblocked' : 'blocks secretory activation'),
        colorToken: 'progesterone',
      },
      {
        label: 'Prolactin',
        value: (c) => c.derived.prolactinNgMl.toFixed(0),
        unit: 'ng/mL',
        secondary: () => 'primed antenatally, sustained by suckling after',
        colorToken: 'lh',
      },
      {
        label: 'Oxytocin / milk',
        value: (c) => `${c.derived.oxytocinRelative.toFixed(0)} · ${c.derived.milkSupplyMlPerDay.toFixed(0)}`,
        unit: 'mL/day',
        secondary: () => 'ejects vs produces — different hormones, different speeds',
        colorToken: 'estrogen',
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
      { kind: 'sparkline', label: 'Haemoglobin', unit: 'g/dL', colorToken: 'hemoglobin', domainMin: 8, domainMax: 15, data: (points) => points.map((p) => p.hb) },
      { kind: 'sparkline', label: 'Progesterone', unit: 'ng/mL', colorToken: 'progesterone', domainMin: 0, domainMax: 140, data: (points) => points.map((p) => p.progesterone) },
      { kind: 'sparkline', label: 'Milk supply', unit: 'mL/day', colorToken: 'estrogen', domainMin: 0, domainMax: 800, data: (points) => points.map((p) => p.milk) },
      { kind: 'sparkline', label: 'Cervical dilation', unit: 'cm', colorToken: 'nociception', domainMin: 0, domainMax: 10, data: (points) => points.map((p) => p.dilation) },
    ],
  };
}
