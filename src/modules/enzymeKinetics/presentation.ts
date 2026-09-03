import { phFactor, rateAt, temperatureFactor } from './engine/kinetics';
import type { KineticsDerived, KineticsHistoryPoint, KineticsInputs, KineticsInternalState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* --- The velocity–substrate plot -------------------------------------
 * Enzyme kinetics is chart-only: there is no anatomy to draw. The house rule that "charts
 * leave the diagram frame" becomes "the diagram IS the plot", so the velocity–substrate curve
 * (Michaelis-Menten) and its double-reciprocal (Lineweaver-Burk) live here as dedicated plot
 * frames drawn with PathNode, like respiratory's Davenport or venousReturn's Guyton plot. */

const MM = { WIDTH: 460, HEIGHT: 276, left: 46, right: 14, top: 16, bottom: 70 } as const;
const MAX_S = 8; // mmol/L shown on the curve
const MAX_V_FRACTION = 1.15; // y axis as a fraction of uninhibited Vmax

/** The chart's x mapping is log-spaced in [S] so the whole decade-spanning curve fits. */
function mmX(s: number): number {
  return MM.left + (Math.log10((Math.max(s, 0.005) + 0.05) / 0.05) / Math.log10(MAX_S / 0.05)) * (MM.WIDTH - MM.left - MM.right);
}
function mmY(v: number, baselineVmax: number): number {
  return MM.HEIGHT - MM.bottom - (v / (baselineVmax * MAX_V_FRACTION)) * (MM.HEIGHT - MM.top - MM.bottom);
}
function mmToPath(samples: { s: number; v: number }[], baselineVmax: number): string {
  return samples
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mmX(p.s).toFixed(1)},${mmY(p.v, baselineVmax).toFixed(1)}`)
    .join(' ');
}

/** Lineweaver-Burk: 1/v vs 1/[S], a straight line whose y-intercept is 1/Vmax′ and whose
 * (negative-x) intercept marks -1/Km′. */
const LB = { WIDTH: 460, HEIGHT: 276, left: 46, right: 14, top: 16, bottom: 60 } as const;
const LB_MAX_INV_S = 6; // 1/[S], L/mmol, at the right edge
function lbInvS(s: number): number {
  return LB.left + (s / LB_MAX_INV_S) * (LB.WIDTH - LB.left - LB.right);
}
function lbInvV(invV: number, yMax: number): number {
  return LB.HEIGHT - LB.bottom - (invV / yMax) * (LB.HEIGHT - LB.top - LB.bottom);
}
function lbToPath(line: { invS: number; invV: number }[], yMax: number): string {
  return line
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${lbInvS(p.invS).toFixed(1)},${lbInvV(p.invV, yMax).toFixed(1)}`)
    .join(' ');
}

type Ctx = PresentationContext<KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint>;

function buildMichaelsMentenFrame(derived: KineticsDerived, inputs: KineticsInputs): FrameNode {
  const baselineVmax = inputs.vmaxUmPerMin;
  const km = derived.apparentKmMm;
  const vmaxApprox = rateAt(1000, derived.apparentVmaxUmPerMin, km);
  const halfV = vmaxApprox / 2;

  // The live active curve, sampled log-spaced from just above zero to MAX_S.
  const activeSamples: { s: number; v: number }[] = [];
  for (let i = 0; i <= 160; i += 1) {
    const s = Math.max(10 ** (Math.log10(0.05) + (i / 160) * Math.log10(MAX_S / 0.05)) - 0.05, 0);
    activeSamples.push({ s, v: rateAt(s, derived.apparentVmaxUmPerMin, km) });
  }
  // The uninhibited reference curve at optimal temperature/pH, for comparison.
  const envFactor = temperatureFactor(inputs.temperatureC) * phFactor(inputs.ph);
  const refSamples: { s: number; v: number }[] = [];
  for (let i = 0; i <= 80; i += 1) {
    const s = Math.max(10 ** (Math.log10(0.05) + (i / 80) * Math.log10(MAX_S / 0.05)) - 0.05, 0);
    refSamples.push({ s, v: rateAt(s, inputs.vmaxUmPerMin * envFactor, inputs.kmMm) });
  }

  const sX = derived.substrateMm;
  const sY = derived.reactionRateUmPerMin;

  return {
    type: 'frame',
    key: 'enzyme-michaels-menten',
    viewBox: [0, 0, MM.WIDTH, MM.HEIGHT],
    ariaLabel: 'Michaelis-Menten velocity against substrate concentration, with the uninhibited reference curve and the apparent Km and Vmax marked',
    children: [
      // axes
      { type: 'line', x1: MM.left, y1: MM.top, x2: MM.left, y2: MM.HEIGHT - MM.bottom, colorToken: 'text-faint' },
      { type: 'line', x1: MM.left, y1: MM.HEIGHT - MM.bottom, x2: MM.WIDTH - MM.right, y2: MM.HEIGHT - MM.bottom, colorToken: 'text-faint' },
      {
        type: 'text',
        x: MM.WIDTH / 2,
        y: MM.HEIGHT - 40,
        text: 'substrate [S] (log scale, mmol/L)',
        cls: 'caption',
        anchor: 'middle',
      },
      {
        type: 'text',
        x: 20,
        y: MM.top + 30,
        text: 'v (µmol/min)',
        cls: 'caption',
      },
      // Vmax asymptote and label
      { type: 'line', x1: MM.left, y1: mmY(vmaxApprox, baselineVmax), x2: MM.WIDTH - MM.right, y2: mmY(vmaxApprox, baselineVmax), colorToken: 'repolarizing' },
      {
        type: 'text',
        x: MM.WIDTH - MM.right - 4,
        y: mmY(vmaxApprox, baselineVmax) - 5,
        text: `Vmax′ ≈ ${vmaxApprox.toFixed(0)}`,
        cls: 'tickLabel',
        anchor: 'end',
      },
      // Km marker: vertical guide to the half-velocity point where Km′ sits on x.
      { type: 'line', x1: mmX(km), y1: mmY(halfV, baselineVmax), x2: mmX(km), y2: MM.HEIGHT - MM.bottom, colorToken: 'conduction-path' },
      { type: 'circle', cx: mmX(km), cy: mmY(halfV, baselineVmax), r: 3, fill: 'conduction-path' },
      {
        type: 'text',
        x: mmX(km) + 5,
        y: MM.HEIGHT - MM.bottom - 6,
        text: `Km′ = ${km < 0.1 ? km.toFixed(3) : km.toFixed(2)}`,
        cls: 'tickLabel',
      },
      // reference then active curve
      { type: 'path', d: mmToPath(refSamples, baselineVmax), colorToken: 'text-faint' },
      { type: 'path', d: mmToPath(activeSamples, baselineVmax), colorToken: 'ecg-trace' },
      // current operating point
      { type: 'line', x1: mmX(sX), y1: mmY(sY, baselineVmax), x2: mmX(sX), y2: MM.HEIGHT - MM.bottom, colorToken: 'potassium' },
      { type: 'circle', cx: mmX(sX), cy: mmY(sY, baselineVmax), r: 4.5, fill: 'potassium' },
      // apparent constants strip
      { type: 'line', x1: MM.left, y1: MM.HEIGHT - 28, x2: MM.WIDTH - MM.right, y2: MM.HEIGHT - 28, colorToken: 'text-faint' },
      {
        type: 'text',
        x: MM.left,
        y: MM.HEIGHT - 10,
        text: `Km′ ${km < 0.1 ? km.toFixed(3) : km.toFixed(2)} mmol/L  ·  Vmax′ ${derived.apparentVmaxUmPerMin.toFixed(0)} µmol/min  ·  saturation ${derived.saturationPct.toFixed(0)}%  ·  residual activity ${derived.residualActivityPct.toFixed(0)}%`,
        cls: 'caption',
      },
    ],
  };
}

function buildLineweaverBurkFrame(derived: KineticsDerived, inputs: KineticsInputs): FrameNode {
  const km = derived.apparentKmMm;
  const appVmax = derived.apparentVmaxUmPerMin;
  const envFactor = temperatureFactor(inputs.temperatureC) * phFactor(inputs.ph);
  const refVm = inputs.vmaxUmPerMin * envFactor;
  const refKm = inputs.kmMm;

  const lineOf = (vMax: number, kmVal: number) => ({
    invS0: 1 / vMax,
    slope: kmVal / vMax,
  });
  const active = lineOf(appVmax, km);
  const ref = lineOf(refVm, refKm);

  // y-axis is 1/v; pick a top that keeps both lines on the canvas.
  const yMax =
    Math.max(
      active.invS0 + active.slope * LB_MAX_INV_S,
      ref.invS0 + ref.slope * LB_MAX_INV_S,
      active.invS0 * 2,
      0.5,
    ) * 1.1;

  const buildLine = (l: { invS0: number; slope: number }) => {
    const pts: { invS: number; invV: number }[] = [];
    for (let s = 0; s <= LB_MAX_INV_S + 1e-9; s += 0.04) {
      pts.push({ invS: s, invV: l.invS0 + l.slope * s });
    }
    return pts;
  };

  // The live operating point, if substrate is present (1/[S] is — ƒ — undefined at [S]=0).
  const invS = derived.substrateMm > 0 ? 1 / derived.substrateMm : undefined;
  const invV = derived.reactionRateUmPerMin > 0 ? 1 / derived.reactionRateUmPerMin : undefined;

  return {
    type: 'frame',
    key: 'enzyme-lineweaver-burk',
    viewBox: [0, 0, LB.WIDTH, LB.HEIGHT],
    ariaLabel: 'Lineweaver-Burk double-reciprocal plot of 1/v against 1/[S], whose y-intercept is 1/Vmax and x-intercept is -1/Km',
    children: [
      // axes
      { type: 'line', x1: LB.left, y1: LB.top, x2: LB.left, y2: LB.HEIGHT - LB.bottom, colorToken: 'text-faint' },
      { type: 'line', x1: LB.left, y1: LB.HEIGHT - LB.bottom, x2: LB.WIDTH - LB.right, y2: LB.HEIGHT - LB.bottom, colorToken: 'text-faint' },
      {
        type: 'text',
        x: LB.WIDTH / 2,
        y: LB.HEIGHT - LB.bottom + 16,
        text: '1/[S] (L/mmol)',
        cls: 'caption',
        anchor: 'middle',
      },
      {
        type: 'text',
        x: 74,
        y: LB.top + 24,
        text: '1/v (min/µmol)',
        cls: 'caption',
      },
      // reference then active line
      { type: 'path', d: lbToPath(buildLine(ref), yMax), colorToken: 'text-faint' },
      { type: 'path', d: lbToPath(buildLine(active), yMax), colorToken: 'ecg-trace' },
      // y-intercepts (1/Vmax)
      { type: 'circle', cx: lbInvS(0), cy: lbInvV(ref.invS0, yMax), r: 3, fill: 'conduction-path' },
      { type: 'circle', cx: lbInvS(0), cy: lbInvV(active.invS0, yMax), r: 3, fill: 'repolarizing' },
      {
        type: 'text',
        x: LB.left + 8,
        y: lbInvV(active.invS0, yMax) - 6,
        text: `1/Vmax′ ≈ ${(1 / appVmax).toFixed(3)}`,
        cls: 'tickLabel',
        anchor: 'middle',
      },
      // current operating point
      ...(invS !== undefined && invV !== undefined
        ? [
            {
              type: 'circle' as const,
              cx: lbInvS(invS),
              cy: lbInvV(invV, yMax),
              r: 4.5,
              fill: 'potassium',
            },
          ]
        : []),
      // x-intercept note
      {
        type: 'text',
        x: LB.WIDTH / 2,
        y: LB.HEIGHT - 14,
        text: `x-intercept = -1/Km′ ≈ ${km > 0 ? (-1 / km).toFixed(2) : '—'} mmol/L`,
        cls: 'caption',
        anchor: 'middle',
      },
    ],
  };
}

export function buildEnzymeKineticsPresentation(ctx: Ctx): ModulePresentation<KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint> {
  const { derived, inputs } = ctx;

  const inhibitionLabel = (d: KineticsDerived): string => {
    switch (d.inhibitorType) {
      case 'competitive':
        return 'Km′ raised — outcompete it';
      case 'noncompetitive':
        return 'Vmax′ cut';
      case 'uncompetitive':
        return 'both cut in proportion';
      default:
        return 'none active';
    }
  };
  const saturationLabel = (d: KineticsDerived): string =>
    d.saturationPct > 90
      ? 'saturated — more substrate barely helps'
      : d.saturationPct < 15
        ? 'first-order — rate tracks substrate'
        : 'mixed-order region';

  return {
    diagram: [buildMichaelsMentenFrame(derived, inputs), buildLineweaverBurkFrame(derived, inputs)],
    controls: [
      {
        kind: 'toggle',
        label: 'Inhibitor class',
        key: 'inhibitorType',
        options: [
          { value: 'none', label: 'None' },
          { value: 'competitive', label: 'Competitive' },
          { value: 'noncompetitive', label: 'Noncomp.' },
          { value: 'uncompetitive', label: 'Uncomp.' },
        ],
        colorToken: 'ecg-trace',
      },
      { kind: 'slider', label: 'Substrate [S]', key: 'substrateMm', min: 0, max: 20, step: 0.05, unit: ' mmol/L' },
      { kind: 'slider', label: 'Vmax', key: 'vmaxUmPerMin', min: 5, max: 200, step: 5, unit: ' µmol/min' },
      { kind: 'slider', label: 'Km', key: 'kmMm', min: 0.05, max: 10, step: 0.05, unit: ' mmol/L' },
      { kind: 'slider', label: 'Inhibitor [I]', key: 'inhibitorUm', min: 0, max: 100, step: 1, unit: ' µmol/L' },
      { kind: 'slider', label: 'Ki', key: 'kiUm', min: 0.2, max: 50, step: 0.2, unit: ' µmol/L' },
      { kind: 'slider', label: 'Temperature', key: 'temperatureC', min: 10, max: 50, step: 1, unit: ' °C' },
      { kind: 'slider', label: 'pH', key: 'ph', min: 4, max: 9, step: 0.1 },
    ],
    readouts: [
      {
        label: 'Reaction rate',
        value: (c) => c.derived.reactionRateUmPerMin.toFixed(1),
        unit: 'µmol/min',
        secondary: (c) => `${c.derived.residualActivityPct.toFixed(0)}% of uninhibited`,
        colorToken: 'ecg-trace',
      },
      {
        label: 'Apparent Km′',
        value: (c) => (c.derived.apparentKmMm < 0.1 ? c.derived.apparentKmMm.toFixed(3) : c.derived.apparentKmMm.toFixed(2)),
        unit: 'mmol/L',
        secondary: (c) => inhibitionLabel(c.derived),
        colorToken: 'conduction-path',
      },
      {
        label: 'Apparent Vmax′',
        value: (c) => c.derived.apparentVmaxUmPerMin.toFixed(0),
        unit: 'µmol/min',
        colorToken: 'repolarizing',
      },
      {
        label: 'Site saturation',
        value: (c) => c.derived.saturationPct.toFixed(0),
        unit: '%',
        secondary: (c) => saturationLabel(c.derived),
        colorToken: 'potassium',
      },
      {
        label: 'Temperature factor',
        value: (c) => `×${c.derived.temperatureFactor.toFixed(2)}`,
        secondary: (c) =>
          c.derived.temperatureFactor > 1.05 ? 'Q10 gain' : c.derived.temperatureFactor < 0.9 ? 'denaturing' : 'near optimum',
        colorToken: 'thermal',
      },
      {
        label: 'pH factor',
        value: (c) => `×${c.derived.phFactor.toFixed(2)}`,
        secondary: (c) => (c.derived.phFactor > 0.95 ? 'at the optimum' : 'off-optimum ionisation'),
        colorToken: 'gastrin',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Reaction rate',
        unit: 'µmol/min',
        colorToken: 'ecg-trace',
        domainMin: 0,
        domainMax: (inputs.vmaxUmPerMin * 1.1),
        data: (points) => points.map((p) => p.rate),
      },
      {
        kind: 'sparkline',
        label: 'Active-site saturation',
        unit: '%',
        colorToken: 'potassium',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.saturationPct),
      },
    ],
  };
}
