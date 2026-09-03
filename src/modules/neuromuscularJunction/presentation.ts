import { clamp } from '@/shared/lib/math';
import { CLASSIFICATION } from './engine/constants';
import type { NmjDerived, NmjHistoryPoint, NmjInputs, NmjState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<NmjState, NmjDerived, NmjInputs, NmjHistoryPoint>;

/* --- Geometry, mirroring the hand-drawn NmjDiagram ------------------- */

const BOUTON = { x: 110, y: 56, w: 320, h: 150 };
const MEMBRANE_Y = BOUTON.y + BOUTON.h; // 206
const ACTIVE_ZONES = [166, 236, 306, 376];
const FOLD = { x0: 120, x1: 404, crest: 252, trough: 290, count: 8 };
const EPP = { x: 470, y: 62, w: 38, h: 228 };

/** The postsynaptic membrane, thrown into junctional folds. */
function foldPath(): string {
  const step = (FOLD.x1 - FOLD.x0) / FOLD.count;
  const parts = [`M ${FOLD.x0} ${FOLD.crest}`];
  for (let i = 0; i < FOLD.count; i += 1) {
    const x = FOLD.x0 + i * step;
    parts.push(`Q ${(x + step * 0.25).toFixed(1)} ${FOLD.trough} ${(x + step * 0.5).toFixed(1)} ${FOLD.trough}`);
    parts.push(`Q ${(x + step * 0.75).toFixed(1)} ${FOLD.trough} ${(x + step).toFixed(1)} ${FOLD.crest}`);
  }
  return parts.join(' ');
}

function crests(): number[] {
  const step = (FOLD.x1 - FOLD.x0) / FOLD.count;
  return Array.from({ length: FOLD.count + 1 }, (_, i) => FOLD.x0 + i * step);
}

/** A rounded-rectangle path used where an outlined region needs a stroke (the schema's
 * RectNode carries only fill, so an outlined muscle fibre has to be drawn as a path). */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}

export function buildNeuromuscularJunctionPresentation(ctx: Ctx): ModulePresentation<NmjState, NmjDerived, NmjInputs, NmjHistoryPoint> {
  const { derived } = ctx;

  // Every control owns a structure. These scales reproduce the legacy NmjDiagram drawing.
  const docked = Math.round(clamp(derived.vesicleReleaseCapacity * derived.vesiclePool, 0, 1.2) * 5);
  const reserveCount = Math.round(clamp(derived.vesiclePool, 0, 1) * 14);
  const calciumPerZone = Math.min(2, Math.round(clamp(derived.calciumChannelFunction, 0, 1.5)));
  const receptorsPerCrest = Math.round(clamp(derived.receptorDensity, 0, 1.4) * 3);
  const esteraseMarkers = Math.round(clamp(derived.acetylcholinesteraseActivity, 0, 1) * 4);
  const blocked = clamp((derived.nondepolarisingBlocker + derived.depolarisingBlocker) / 100, 0, 1);
  const achPerZone = Math.round(clamp(derived.quantalContent / 60, 0, 1.4) * 4);

  const eppFraction = clamp(derived.endPlatePotentialMv / 60, 0, 1);
  const thresholdFraction = clamp(derived.endPlatePotentialMv / Math.max(derived.safetyFactor, 0.05) / 60, 0.02, 1);

  const reserveVesicles: SceneNode[] = Array.from({ length: 14 }, (_, i) => ({
    type: 'circle',
    cx: 150 + (i % 7) * 42,
    cy: BOUTON.y + 52 + Math.floor(i / 7) * 26,
    r: 6,
    fill: i < reserveCount ? 'axon' : 'none',
  }));

  const zones: SceneNode[] = ACTIVE_ZONES.flatMap((zx) => {
    const dockedVesicles: SceneNode[] = Array.from({ length: 5 }, (_, i) =>
      i < docked
        ? {
            type: 'circle',
            cx: zx - 16 + (i % 3) * 16,
            cy: MEMBRANE_Y - 14 - Math.floor(i / 3) * 15,
            r: 6,
            fill: 'axon',
          }
        : { type: 'circle', cx: 0, cy: 0, r: 0, fill: 'none' },
    );
    const channels: SceneNode[] = [-16, 16].slice(0, calciumPerZone).map((dx) => ({
      type: 'rect',
      x: zx + dx - 4,
      y: MEMBRANE_Y - 8,
      width: 8,
      height: 13,
      fill: 'pth',
    }));
    const ach: SceneNode[] = Array.from({ length: 4 }, (_, i) =>
      i < achPerZone
        ? {
            type: 'circle',
            cx: zx - 15 + (i % 4) * 10,
            cy: MEMBRANE_Y + 14 + (i % 2) * 12,
            r: 3,
            fill: 'second-messenger',
          }
        : { type: 'circle', cx: 0, cy: 0, r: 0 },
    );
    return [
      ...dockedVesicles,
      { type: 'rect', x: zx - 22, y: MEMBRANE_Y - 4, width: 44, height: 5, fill: 'axon' },
      ...channels,
      ...ach,
    ];
  });

  const esterases: SceneNode[] = [196, 266, 336, 406].slice(0, esteraseMarkers).flatMap((ex) => [
    {
      type: 'path',
      d: `M ${ex - 6} ${MEMBRANE_Y + 18} L ${ex} ${MEMBRANE_Y + 25} L ${ex + 6} ${MEMBRANE_Y + 18}`,
      colorToken: 'somatostatin',
      fill: 'none',
      strokeWidth: 2,
    },
    {
      type: 'path',
      d: `M ${ex} ${MEMBRANE_Y + 25} L ${ex} ${MEMBRANE_Y + 32}`,
      colorToken: 'somatostatin',
      fill: 'none',
      strokeWidth: 2,
    },
  ]);

  const receptors: SceneNode[] = crests().flatMap((cx) =>
    Array.from({ length: receptorsPerCrest }, (_, i) => ({
      type: 'rect',
      x: cx - 9 + i * 7,
      y: FOLD.crest - 6,
      width: 5,
      height: 7,
      fill: i / Math.max(receptorsPerCrest, 1) < blocked ? 'danger' : 'sarcomere',
    })),
  );

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'The neuromuscular junction: the nerve terminal with docked vesicles and voltage-gated calcium channels at its active zones, the synaptic cleft with acetylcholinesterase, and the postsynaptic junctional folds carrying acetylcholine receptors on their crests',
        children: [
          // ---- Nerve terminal ----
          {
            type: 'path',
            d: `M ${BOUTON.x} ${MEMBRANE_Y} L ${BOUTON.x} ${BOUTON.y + 40} Q ${BOUTON.x} ${BOUTON.y} ${BOUTON.x + 46} ${BOUTON.y} L ${BOUTON.x + BOUTON.w - 46} ${BOUTON.y} Q ${BOUTON.x + BOUTON.w} ${BOUTON.y} ${BOUTON.x + BOUTON.w} ${BOUTON.y + 40} L ${BOUTON.x + BOUTON.w} ${MEMBRANE_Y} Z`,
            colorToken: 'axon',
            fill: 'none',
            strokeWidth: 2,
          },
          { type: 'text', cls: 'anatomyStrong', x: BOUTON.x + 12, y: BOUTON.y + 22, text: 'Nerve terminal' },
          ...reserveVesicles,
          ...zones,
          { type: 'text', cls: 'anatomy', x: 20, y: MEMBRANE_Y - 6, text: 'Active zones' },
          // ---- Synaptic cleft and its enzyme ----
          { type: 'text', cls: 'anatomy', x: 438, y: MEMBRANE_Y + 26, text: 'Cleft' },
          ...esterases,
          { type: 'text', cls: 'anatomy', x: 20, y: MEMBRANE_Y + 26, text: 'Acetylcholinesterase' },
          // ---- Postsynaptic membrane ----
          { type: 'path', d: foldPath(), colorToken: 'sarcomere', fill: 'none', strokeWidth: 2.5 },
          ...receptors,
          { type: 'text', cls: 'anatomy', x: FOLD.x1 + 8, y: FOLD.trough, text: 'Folds' },
          { type: 'text', cls: 'anatomy', x: 20, y: FOLD.crest + 4, text: 'ACh receptors' },
          // ---- Muscle fibre (outlined, strength in the label) ----
          {
            type: 'path',
            d: roundedRect(110, 304, 320, 44, 8),
            colorToken: 'sarcomere',
            fill: 'none',
            strokeWidth: 2,
          },
          {
            type: 'text',
            cls: 'anatomyStrong',
            x: 270,
            y: 331,
            text: `Muscle fibre · ${derived.muscleForcePercent.toFixed(0)}%`,
            anchor: 'middle',
          },
          // ---- End-plate potential against threshold ----
          { type: 'rect', x: EPP.x, y: EPP.y, width: EPP.w, height: EPP.h, fill: 'text' },
          {
            type: 'rect',
            x: EPP.x,
            y: EPP.y + EPP.h - eppFraction * EPP.h,
            width: EPP.w,
            height: Math.max(eppFraction * EPP.h, 2),
            fill: 'vm',
          },
          {
            type: 'line',
            x1: EPP.x - 6,
            x2: EPP.x + EPP.w + 6,
            y1: EPP.y + EPP.h - thresholdFraction * EPP.h,
            y2: EPP.y + EPP.h - thresholdFraction * EPP.h,
            colorToken: 'danger',
          },
          {
            type: 'text',
            cls: 'valueLabel',
            x: EPP.x + EPP.w / 2,
            y: EPP.y - 8,
            text: 'EPP vs threshold',
            anchor: 'middle',
          },
          {
            type: 'text',
            cls: 'valueLabel',
            x: EPP.x + EPP.w / 2,
            y: EPP.y + EPP.h + 16,
            text: `${derived.endPlatePotentialMv.toFixed(0)} mV`,
            anchor: 'middle',
          },
          // ---- Readout lines drawn inside the frame ----
          {
            type: 'text',
            cls: 'label',
            x: 20,
            y: 372,
            text: `Safety factor ${derived.safetyFactor.toFixed(2)} · quanta ${derived.quantalContent.toFixed(0)}`,
          },
          {
            type: 'text',
            cls: 'caption',
            x: 20,
            y: 392,
            text: `train-of-four ${derived.trainOfFourRatio.toFixed(2)} · post-tetanic ${derived.postTetanicRatio.toFixed(2)} · desensitisation ${(derived.desensitisation * 100).toFixed(0)}%`,
          },
          { type: 'text', cls: 'verdict', x: 20, y: 416, text: derived.classification },
          { type: 'text', cls: 'label', x: 20, y: 434, text: derived.patternSummary },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Vesicle release', key: 'vesicleReleaseCapacity', min: 0, max: 1.5, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Calcium channels', key: 'calciumChannelFunction', min: 0, max: 1.5, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Receptor density', key: 'receptorDensity', min: 0, max: 1.5, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Cholinesterase', key: 'acetylcholinesteraseActivity', min: 0, max: 2, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Non-depolarising blocker', key: 'nondepolarisingBlocker', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Depolarising blocker', key: 'depolarisingBlocker', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Stimulation rate', key: 'stimulationFrequencyHz', min: 0.5, max: 50, step: 0.5, unit: ' Hz' },
    ],
    readouts: [
      {
        label: 'Safety factor',
        value: (c) => c.derived.safetyFactor.toFixed(2),
        secondary: (c) => (c.derived.safetyFactor < CLASSIFICATION.LOW_SAFETY_FACTOR ? 'reserve spent' : 'reserve intact'),
        colorToken: 'vm',
      },
      {
        label: 'Muscle force',
        value: (c) => c.derived.muscleForcePercent.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.muscleForcePercent < CLASSIFICATION.WEAK_FORCE_PERCENT ? 'weak' : 'full'),
        colorToken: 'sarcomere',
      },
      { label: 'End-plate potential', value: (c) => c.derived.endPlatePotentialMv.toFixed(1), unit: 'mV', colorToken: 'o2' },
      { label: 'Quanta released', value: (c) => c.derived.quantalContent.toFixed(0), colorToken: 'vm' },
      {
        label: 'Train-of-four ratio',
        value: (c) => c.derived.trainOfFourRatio.toFixed(2),
        secondary: (c) => (c.derived.trainOfFourRatio < CLASSIFICATION.FADE_RATIO ? 'fade' : 'no fade'),
        colorToken: 'artery',
      },
      {
        label: 'High-rate response',
        value: (c) => `${c.derived.postTetanicRatio.toFixed(2)}x`,
        secondary: (c) =>
          c.derived.postTetanicRatio >= CLASSIFICATION.INCREMENT_RATIO ? 'increment — presynaptic' : 'no increment',
        colorToken: 'artery',
      },
      { label: 'Vesicle pool', value: (c) => (c.derived.vesiclePool * 100).toFixed(0), unit: '%', colorToken: 'vm' },
      {
        label: 'Desensitisation',
        value: (c) => (c.derived.desensitisation * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.desensitisation > 0.4 ? 'end plate held depolarised' : undefined),
        colorToken: 'danger',
      },
      {
        label: 'Lesion',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'Muscle force', unit: '%', colorToken: 'sarcomere', domainMin: 0, domainMax: 100, data: (p) => p.map((h) => h.force) },
      { kind: 'sparkline', label: 'Safety factor', colorToken: 'vm', domainMin: 0, domainMax: 6, data: (p) => p.map((h) => h.safetyFactor) },
      { kind: 'sparkline', label: 'End-plate potential', unit: 'mV', colorToken: 'o2', domainMin: 0, domainMax: 70, data: (p) => p.map((h) => h.epp) },
      { kind: 'sparkline', label: 'Train-of-four ratio', unit: '%', colorToken: 'artery', domainMin: 0, domainMax: 120, data: (p) => p.map((h) => h.tofRatio) },
    ],
  };
}
