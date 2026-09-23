import { clamp } from '@/shared/lib/math';
import { TENSION, FORCE_VELOCITY, LENGTH_TENSION } from './engine/constants';
import { lengthTensionFactor, passiveTension } from './engine/lengthTension';
import { shorteningVelocity } from './engine/forceVelocity';
import type { MuscleDerived, MuscleHistoryPoint, MuscleInputs, MuscleState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint>;

/*
 * Sarcomere geometry, translated 1:1 from the hand-written <Sarcomere/>. The sliding-filament
 * story lives entirely here: the filaments keep their fixed length while the Z-discs move apart,
 * so filament overlap — and therefore the cross-bridges that can form — is pure geometry.
 */
const PX_PER_UM = 100;
const THICK_FILAMENT_UM = 1.6;
const THIN_FILAMENT_UM = 1;
const BRIDGE_SPACING_PX = 13;
const CENTER_X = 252;
const CENTER_Y = 178;

const SARCOMERE = 'sarcomere' as const;

/** The calcium ions scattered in the cytosol, each appearing above its own concentration
 *  threshold so the cloud thickens and thins with the transient rather than merely fading. */
const CALCIUM_IONS: ReadonlyArray<{ x: number; y: number; threshold: number }> = [
  { x: 150, y: 128, threshold: 0.15 },
  { x: 196, y: 118, threshold: 0.45 },
  { x: 244, y: 124, threshold: 0.3 },
  { x: 292, y: 116, threshold: 0.6 },
  { x: 338, y: 128, threshold: 0.9 },
  { x: 172, y: 232, threshold: 0.25 },
  { x: 220, y: 240, threshold: 0.55 },
  { x: 268, y: 234, threshold: 0.8 },
  { x: 316, y: 242, threshold: 1.1 },
  { x: 364, y: 230, threshold: 1.4 },
];

const TENSION_BAR = { x: 60, y: 268, width: 360, height: 10 };

interface SarcomereGeometry {
  zLeft: number;
  zRight: number;
  thickLeft: number;
  thickRight: number;
  leftThinEnd: number;
  rightThinStart: number;
  bridges: ReadonlyArray<{ x: number; up: boolean }>;
}

function sarcomereGeometry(lengthUm: number): SarcomereGeometry {
  const halfLength = (lengthUm * PX_PER_UM) / 2;
  const zLeft = CENTER_X - halfLength;
  const zRight = CENTER_X + halfLength;
  const thickLeft = CENTER_X - (THICK_FILAMENT_UM * PX_PER_UM) / 2;
  const thickRight = CENTER_X + (THICK_FILAMENT_UM * PX_PER_UM) / 2;
  const thinLength = THIN_FILAMENT_UM * PX_PER_UM;
  const leftThinEnd = zLeft + thinLength;
  const rightThinStart = zRight - thinLength;

  const bridges: { x: number; up: boolean }[] = [];
  for (let x = thickLeft + BRIDGE_SPACING_PX / 2; x < thickRight; x += BRIDGE_SPACING_PX) {
    const facesLeftThin = x <= leftThinEnd;
    const facesRightThin = x >= rightThinStart;
    if (facesLeftThin || facesRightThin) bridges.push({ x, up: facesLeftThin });
  }

  return { zLeft, zRight, thickLeft, thickRight, leftThinEnd, rightThinStart, bridges };
}

function sarcomereNodes(g: SarcomereGeometry, attachedFraction: number): SceneNode[] {
  const nodes: SceneNode[] = [];
  // Cross-bridges first, under the filaments, so the overlap zone reads as bridges forming
  // where thick and thin actually face each other. Width grades with attachment.
  const bridgeWidth = 1.5 + attachedFraction * 2.5;
  for (const bridge of g.bridges) {
    nodes.push(
      {
        type: 'path',
        d: `M${bridge.x},${CENTER_Y} L${bridge.x},${bridge.up ? CENTER_Y - 10 : CENTER_Y + 10}`,
        colorToken: SARCOMERE,
        strokeWidth: bridgeWidth,
      },
    );
  }
  // Z-discs: the only thing that actually moves when the muscle shortens.
  nodes.push(
    { type: 'path', d: `M${g.zLeft},${CENTER_Y - 26} L${g.zLeft},${CENTER_Y + 26}`, colorToken: SARCOMERE, strokeWidth: 4 },
    { type: 'path', d: `M${g.zRight},${CENTER_Y - 26} L${g.zRight},${CENTER_Y + 26}`, colorToken: SARCOMERE, strokeWidth: 4 },
  );
  // Thin filaments, anchored to each Z-disc and pointing inwards.
  nodes.push(
    { type: 'path', d: `M${g.zLeft},${CENTER_Y - 11} L${g.leftThinEnd},${CENTER_Y - 11}`, colorToken: SARCOMERE, strokeWidth: 2.5 },
    { type: 'path', d: `M${g.zRight},${CENTER_Y + 11} L${g.rightThinStart},${CENTER_Y + 11}`, colorToken: SARCOMERE, strokeWidth: 2.5 },
  );
  // Thick filament: fixed length, always centred.
  nodes.push(
    { type: 'path', d: `M${g.thickLeft},${CENTER_Y} L${g.thickRight},${CENTER_Y}`, colorToken: SARCOMERE, strokeWidth: 7 },
  );
  nodes.push(
    { type: 'text', x: g.zLeft, y: CENTER_Y + 40, text: 'Z', colorToken: 'text-faint', anchor: 'middle', cls: 'tickLabel' },
    { type: 'text', x: g.zRight, y: CENTER_Y + 40, text: 'Z', colorToken: 'text-faint', anchor: 'middle', cls: 'tickLabel' },
  );
  return nodes;
}

export function buildMuscleContractionPresentation(ctx: Ctx): ModulePresentation<MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint> {
  const { derived, state } = ctx;

  const srFillHeight = clamp(derived.srCalciumLoad, 0, 1) * 34;
  const activeWidth = clamp(derived.activeTension / TENSION.MAX_PERCENT, 0, 1) * TENSION_BAR.width;
  const passiveWidth = clamp(derived.passiveTension / TENSION.MAX_PERCENT, 0, 1) * TENSION_BAR.width;
  const g = sarcomereGeometry(derived.sarcomereLengthUm);

  const visibleIons = CALCIUM_IONS.filter((ion) => derived.cytosolicCalciumUM >= ion.threshold).map(
    (ion): SceneNode => ({ type: 'circle', cx: ion.x, cy: ion.y, r: 3.2, fill: 'calcium' }),
  );

  // The excitation signal at the triad glows the T-tubule as each stimulus arrives.
  const tTubuleGlow = state.excitationPulse > 0.05 ? 4 : 1.5;

  const diagramChildren: SceneNode[] = [];
  /* Extracellular calcium, OUTSIDE the membrane where it belongs.
   *
   * It reached `derived` as a passthrough nothing drew, which is a strange omission in a module
   * about calcium: cardiac and smooth muscle depend on the outside pool in a way skeletal muscle
   * does not, and that contrast is the point of the muscle-type toggle beside it. Drawn as a band
   * of ions along the top of the cell rather than a number. */
  diagramChildren.push(
    { type: 'text', x: 20, y: 18, text: 'extracellular Ca²⁺', cls: 'pathLabel' },
    ...Array.from({ length: Math.round(clamp(derived.extracellularCalcium / 2.5, 0, 1) * 9) }, (_, k) => ({
      type: 'circle' as const,
      cx: 150 + k * 22,
      cy: 14,
      r: 3.2,
      fill: 'calcium',
      fillOpacity: 0.8,
    })),
  );
  // --- Sarcoplasmic reticulum with its calcium-store fill level ---
  diagramChildren.push(
    { type: 'rect', x: 30, y: 62, width: 26, height: 38, fill: 'calcium' },
    { type: 'rect', x: 32, y: 98 - srFillHeight, width: 22, height: srFillHeight, fill: 'calcium' },
    { type: 'text', x: 20, y: 54, text: 'SR store', cls: 'pathLabel' },
    { type: 'text', x: 43, y: 114, text: `${(derived.srCalciumLoad * 100).toFixed(0)}%`, cls: 'valueLabel', colorToken: 'calcium' },
  );
  // --- T-tubule carrying the action potential down to the triad ---
  diagramChildren.push(
    { type: 'path', d: 'M96,58 L96,250', colorToken: 'vm', strokeWidth: tTubuleGlow ? 4 : 1.5 },
    { type: 'text', x: 72, y: 50, text: 'T-tubule', cls: 'pathLabel' },
  );
  // --- Scattered cytosolic calcium ions ---
  diagramChildren.push(...visibleIons);
  diagramChildren.push(
    {
      type: 'text',
      x: 150,
      y: 100,
      text: `Cytosolic Ca2+ ${derived.cytosolicCalciumUM.toFixed(2)} uM`,
      cls: 'pathLabel',
      colorToken: 'calcium',
    },
  );
  // --- The sarcomere itself ---
  diagramChildren.push(...sarcomereNodes(g, derived.activeCrossBridgeFraction));
  diagramChildren.push(
    {
      type: 'text',
      x: 252,
      y: 228,
      text: `${derived.sarcomereLengthUm.toFixed(2)} um · overlap ${(derived.lengthTensionFactor * 100).toFixed(0)}%`,
      cls: 'valueLabel',
      anchor: 'middle',
    },
  );
  // --- Tension gauge: active tension with passive stacked on top ---
  diagramChildren.push(
    { type: 'text', x: 60, y: 262, text: `Tension — ${derived.contractionMode}`, cls: 'pathLabel' },
    { type: 'rect', x: TENSION_BAR.x, y: TENSION_BAR.y, width: TENSION_BAR.width, height: TENSION_BAR.height, fill: 'text-faint' },
    { type: 'rect', x: TENSION_BAR.x, y: TENSION_BAR.y, width: activeWidth, height: TENSION_BAR.height, fill: SARCOMERE },
    { type: 'rect', x: TENSION_BAR.x + activeWidth, y: TENSION_BAR.y, width: passiveWidth, height: TENSION_BAR.height, fill: 'vm' },
    { type: 'text', x: 440, y: 277, text: `${derived.totalTension.toFixed(0)}%`, cls: 'valueLabel', anchor: 'end' },
  );
  // --- Status badges ---
  if (derived.isInRigor) {
    diagramChildren.push({ type: 'text', x: 400, y: 120, text: 'Rigor — no ATP', colorToken: 'danger', anchor: 'middle', cls: 'caption' });
  }
  if (derived.isLatched) {
    diagramChildren.push({ type: 'text', x: 400, y: 138, text: 'Latch state', colorToken: 'ok', anchor: 'middle', cls: 'caption' });
  }
  // --- Muscle-type readout block (top right) ---
  diagramChildren.push(
    { type: 'text', x: 356, y: 54, text: derived.muscleType, cls: 'pathLabel' },
    {
      type: 'text',
      x: 356,
      y: 70,
      text: derived.isFused ? 'fused tetanus' : derived.isTetanic ? 'summating' : 'twitch',
      cls: 'pathLabel',
    },
  );
  if (derived.temperatureC > 39) {
    diagramChildren.push({ type: 'text', x: 356, y: 86, text: `${derived.temperatureC.toFixed(1)} C`, cls: 'pathLabel', colorToken: 'danger' });
  }

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Animated diagram of a sarcomere: calcium released from the sarcoplasmic reticulum into the cytosol, cross-bridges forming where thick and thin filaments overlap, and the tension that results',
        children: diagramChildren,
      },
    ],
    controls: [
      {
        kind: 'toggle',
        label: 'Muscle type',
        key: 'muscleType',
        options: [
          { value: 'skeletal', label: 'Skeletal' },
          { value: 'cardiac', label: 'Cardiac' },
          { value: 'smooth', label: 'Smooth' },
        ],
        colorToken: 'sarcomere',
      },
      { kind: 'slider', label: 'Stimulation frequency', key: 'stimulationFrequencyHz', min: 0, max: 100, step: 1, unit: ' Hz' },
      { kind: 'slider', label: 'Motor units recruited', key: 'motorUnitRecruitment', min: 0, max: 1, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Resting sarcomere length', key: 'restingSarcomereLengthUm', min: 1.3, max: 3.8, step: 0.05, unit: ' um' },
      { kind: 'slider', label: 'Afterload', key: 'afterload', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'SERCA pump activity', key: 'sercaActivity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'RyR leak', key: 'ryrLeak', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Extracellular Ca2+', key: 'extracellularCalcium', min: 0.5, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'ATP availability', key: 'atpAvailability', min: 0, max: 1, step: 0.01, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'Cytosolic Ca2+',
        value: (c) => c.derived.cytosolicCalciumUM.toFixed(2),
        unit: 'uM',
        secondary: (c) => `SR store ${(c.derived.srCalciumLoad * 100).toFixed(0)}%`,
        colorToken: 'calcium',
      },
      {
        label: 'Troponin occupied',
        value: (c) => c.derived.troponinOccupancy.toFixed(2),
        secondary: () => 'calcium → activation',
        colorToken: 'calcium',
      },
      {
        label: 'Cross-bridges attached',
        value: (c) => c.derived.activeCrossBridgeFraction.toFixed(2),
        secondary: (c) =>
          c.derived.isInRigor ? 'rigor — cannot detach' : c.derived.isLatched ? 'latch bridges holding' : undefined,
        colorToken: 'sarcomere',
      },
      {
        label: 'Active tension',
        value: (c) => c.derived.activeTension.toFixed(0),
        unit: '%',
        secondary: (c) => `max isometric ${c.derived.maxIsometricTension.toFixed(0)}%`,
        colorToken: 'sarcomere',
      },
      {
        label: 'Passive tension',
        value: (c) => c.derived.passiveTension.toFixed(0),
        unit: '%',
        secondary: () => 'titin & connective tissue',
        colorToken: 'sarcomere',
      },
      {
        label: 'Sarcomere length',
        value: (c) => c.derived.sarcomereLengthUm.toFixed(2),
        unit: 'um',
        secondary: (c) => `overlap ${(c.derived.lengthTensionFactor * 100).toFixed(0)}%`,
        colorToken: 'sarcomere',
      },
      {
        label: 'Shortening velocity',
        value: (c) => c.derived.shorteningVelocityUmPerS.toFixed(2),
        unit: 'um/s',
        secondary: (c) => c.derived.contractionMode,
        colorToken: 'vm',
      },
      {
        label: 'Power output',
        value: (c) => (c.derived.powerOutput / 10).toFixed(1),
        secondary: () => 'tension x velocity',
        colorToken: 'vm',
      },
      {
        label: 'Stimulus interval',
        value: (c) =>
          Number.isFinite(c.derived.effectiveStimulusIntervalMs) ? c.derived.effectiveStimulusIntervalMs.toFixed(0) : '--',
        unit: 'ms',
        secondary: (c) =>
          c.derived.isFused ? 'fused tetanus' : c.derived.isTetanic ? 'summating' : 'separate twitches',
        colorToken: 'vm',
      },
      {
        label: 'Motor units active',
        value: (c) => c.derived.activeMotorUnits.toFixed(0),
        secondary: () => 'smallest recruited first',
        colorToken: 'axon',
      },
      {
        label: 'Relaxation time',
        value: (c) => c.derived.relaxationTimeMs.toFixed(0),
        unit: 'ms',
        secondary: () => 'set by SERCA & ATP',
        colorToken: 'calcium',
      },
      {
        label: 'Temperature',
        value: (c) => c.derived.temperatureC.toFixed(1),
        unit: 'C',
        secondary: () => 'heat from ATP turnover',
        colorToken: derived.temperatureC > 39 ? 'danger' : 'text-dim',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Cytosolic Ca2+',
        unit: 'uM',
        colorToken: 'calcium',
        domainMin: 0,
        domainMax: 3,
        data: (points) => points.map((p) => p.calcium),
      },
      {
        kind: 'sparkline',
        label: 'Tension',
        unit: '%',
        colorToken: 'sarcomere',
        domainMin: 0,
        domainMax: 120,
        data: (points) => points.map((p) => p.tension),
      },
      {
        kind: 'od-curve',
        curveFn: (lengthUm: number) => lengthTensionFactor(lengthUm) * TENSION.MAX_PERCENT + passiveTension(lengthUm),
        currentX: (c) => c.derived.sarcomereLengthUm,
        currentY: (c) => c.derived.totalTension,
        xDomain: [LENGTH_TENSION.MIN_LENGTH_UM, LENGTH_TENSION.MAX_LENGTH_UM],
        yDomain: [0, 140],
        xLabel: 'sarcomere length',
        yLabel: 'tension',
        colorToken: 'sarcomere',
      },
      {
        kind: 'od-curve',
        curveFn: (load: number) => shorteningVelocity(derived.maxIsometricTension, load),
        currentX: (c) => c.derived.activeTension,
        currentY: (c) => c.derived.shorteningVelocityUmPerS,
        xDomain: [0, TENSION.MAX_PERCENT],
        yDomain: [0, FORCE_VELOCITY.VMAX_UM_PER_S],
        xLabel: 'load',
        yLabel: 'velocity',
        colorToken: 'vm',
      },
    ],
  };
}
