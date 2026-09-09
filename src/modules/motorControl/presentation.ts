import { clamp } from '@/shared/lib/math';
import { TREMOR } from './engine/constants';
import { dysmetriaPct } from './engine/motorMechanics';
import type { MotorDerived, MotorHistoryPoint, MotorInputs, MotorInternalState } from './engine/types';
import { LABEL_WASH } from '@/shared/presentation/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const DYSMETRIA_MAX = dysmetriaPct(0);

type Ctx = PresentationContext<MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint>;

/** Connection weight drives both thickness and opacity, same shape as the legacy `.connection`.
 *  width = 1 + strength * 2.6. */
const edgeWidth = (strength: number) => 1 + clamp(strength, 0.05, 1.6) * 2.6;

export function buildMotorControlPresentation(ctx: Ctx): ModulePresentation<MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint> {
  const { derived } = ctx;

  // Same node states the legacy diagram read off the engine's own consequences.
  const dopamine = clamp(derived.effectiveDopaminePct / 100, 0, 1.3);
  const striatalLoss = clamp(derived.choreaAmp / TREMOR.CHOREA_MAX_AMP, 0, 1);
  const stnLoss = clamp(derived.ballismAmp / TREMOR.BALLISM_MAX_AMP, 0, 1);
  const cerebellarLoss = clamp(derived.dysmetriaPct / DYSMETRIA_MAX, 0, 1);
  const corticospinalLoss = clamp(derived.spasticityScore / 10, 0, 1);
  const brady = clamp(derived.bradykinesiaIndex, 0, 1);

  const directDrive = clamp(dopamine, 0.05, 1.4);
  const indirectDrive = clamp((1.6 - dopamine) * (1 - striatalLoss), 0.05, 1.5);
  const stnDrive = clamp(indirectDrive * (1 - stnLoss), 0.05, 1.5);
  const gpiOutput = clamp(0.3 + brady * 1.2, 0.05, 1.6);
  const thalamicOutput = clamp(1.3 - brady, 0.05, 1.4);

  // Stylesheet fills let a lesioned nucleus fade toward the panel as it is lost.
  const integrity = (i: number) => ({ integrity: clamp(i, 0, 1) });

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'The basal ganglia loop with its direct and indirect pathways signed excitatory or inhibitory, the substantia nigra, the cerebellum and the corticospinal tract',
        defs: [
          { type: 'marker', id: 'motorExcite', colorToken: 'basal-ganglia' },
          { type: 'marker', id: 'motorInhibit', colorToken: 'nociception' },
        ],
        children: [
          /* ---- The loop ---- */
          /* Every box and nucleus here is washed rather than filled: each one carries its own name
             across the middle of it, and at full strength the label read at 1.3:1. */
          { type: 'rect', x: 190, y: 26, width: 150, height: 32, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia' },
          { type: 'text', x: 265, y: 47, text: 'Cortex', cls: 'label', anchor: 'middle' },

          { type: 'rect', x: 190, y: 88, width: 150, height: 30, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia', styleVars: integrity(1 - striatalLoss) },
          { type: 'text', x: 265, y: 108, text: 'Striatum', cls: 'label', anchor: 'middle' },

          // Substantia nigra: the dopamine source, drawn so the number has an origin.
          { type: 'circle', cx: 116, cy: 103, r: 18, fill: 'second-messenger', fillOpacity: LABEL_WASH, stroke: 'second-messenger', styleVars: integrity(clamp(dopamine, 0, 1)) },
          { type: 'text', x: 116, y: 100, text: 'SNc', cls: 'label', anchor: 'middle' },
          { type: 'text', x: 116, y: 112, text: `${derived.effectiveDopaminePct.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle' },

          { type: 'rect', x: 112, y: 152, width: 88, height: 28, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia' },
          { type: 'text', x: 156, y: 171, text: 'GPe', cls: 'label', anchor: 'middle' },

          { type: 'circle', cx: 156, cy: 222, r: 20, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia', styleVars: integrity(1 - stnLoss) },
          { type: 'text', x: 156, y: 226, text: 'STN', cls: 'label', anchor: 'middle' },

          { type: 'rect', x: 262, y: 186, width: 98, height: 28, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia' },
          { type: 'text', x: 311, y: 205, text: 'GPi / SNr', cls: 'label', anchor: 'middle' },

          { type: 'rect', x: 206, y: 256, width: 134, height: 30, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia' },
          { type: 'text', x: 273, y: 276, text: 'Thalamus', cls: 'label', anchor: 'middle' },

          /* ---- Connections. Arrowhead excites, crossbar inhibits (crossbars render as
           * arrowheads in the shared marker set; the sign is carried by colour). ---- */
          { type: 'path', d: 'M 265 58 L 265 84', colorToken: 'basal-ganglia', strokeWidth: edgeWidth(1), markerEnd: 'motorExcite' },
          { type: 'path', d: 'M 142 103 L 186 103', colorToken: 'second-messenger', strokeWidth: edgeWidth(dopamine), markerEnd: 'motorExcite' },

          // Direct: striatum inhibits GPi, which releases the thalamus — a double negative.
          { type: 'path', d: 'M 306 118 C 322 142, 322 162, 316 182', colorToken: 'nociception', strokeWidth: edgeWidth(directDrive), markerEnd: 'motorInhibit' },
          { type: 'text', x: 330, y: 150, text: 'direct', cls: 'pathLabel' },

          // Indirect: striatum inhibits GPe, GPe stops inhibiting STN, STN drives GPi harder.
          { type: 'path', d: 'M 218 118 C 196 132, 176 140, 164 148', colorToken: 'nociception', strokeWidth: edgeWidth(indirectDrive), markerEnd: 'motorInhibit' },
          { type: 'text', x: 150, y: 136, text: 'indirect', cls: 'pathLabel', anchor: 'end' },
          { type: 'path', d: 'M 156 180 L 156 198', colorToken: 'nociception', strokeWidth: edgeWidth(indirectDrive), markerEnd: 'motorInhibit' },
          { type: 'path', d: 'M 176 235 C 214 234, 244 220, 258 208', colorToken: 'basal-ganglia', strokeWidth: edgeWidth(stnDrive), markerEnd: 'motorExcite' },

          { type: 'path', d: 'M 306 214 C 300 234, 292 244, 286 252', colorToken: 'nociception', strokeWidth: edgeWidth(gpiOutput), markerEnd: 'motorInhibit' },
          { type: 'path', d: 'M 340 271 L 372 271 L 372 42 L 344 42', colorToken: 'basal-ganglia', strokeWidth: edgeWidth(thalamicOutput), markerEnd: 'motorExcite' },

          /* ---- Outside the loop: the two other places a preset lesions ---- */
          { type: 'circle', cx: 462, cy: 120, r: 38, fill: 'basal-ganglia', fillOpacity: LABEL_WASH, stroke: 'basal-ganglia', styleVars: integrity(1 - cerebellarLoss) },
          { type: 'text', x: 462, y: 116, text: 'Cerebellum', cls: 'label', anchor: 'middle' },
          { type: 'text', x: 462, y: 130, text: `dysmetria ${derived.dysmetriaPct.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle' },
          { type: 'path', d: 'M 406 138 C 384 160, 374 200, 372 236', colorToken: 'second-messenger', strokeWidth: edgeWidth(1 - cerebellarLoss), markerEnd: 'motorExcite' },

          { type: 'path', d: 'M 340 34 L 534 34 L 534 282', colorToken: 'sarcomere', strokeWidth: edgeWidth(1 - corticospinalLoss), markerEnd: 'motorExcite' },
          { type: 'text', x: 532, y: 186, text: 'corticospinal', cls: 'pathLabel', anchor: 'end' },

          { type: 'rect', x: 400, y: 288, width: 140, height: 32, fill: 'sarcomere', fillOpacity: LABEL_WASH, stroke: 'sarcomere', styleVars: integrity(clamp(derived.achievedAmplitudePct / 100, 0, 1)) },
          { type: 'text', x: 470, y: 302, text: 'Movement', cls: 'label', anchor: 'middle' },
          { type: 'text', x: 470, y: 314, text: `${derived.achievedAmplitudePct.toFixed(0)}% of command`, cls: 'valueLabel', anchor: 'middle' },

          /* ---- Readouts ---- */
          { type: 'text', x: 20, y: 330, text: `latency ${derived.initiationLatencyMs.toFixed(0)} ms · rigidity ${derived.rigidityScore.toFixed(1)} · spasticity ${derived.spasticityScore.toFixed(1)}`, cls: 'caption' },
          { type: 'text', x: 20, y: 350, text: `tremor — rest ${derived.restingTremorAmp.toFixed(1)} · intention ${derived.intentionTremorAmp.toFixed(1)} · postural ${derived.posturalTremorAmp.toFixed(1)}`, cls: 'caption' },
          { type: 'text', x: 20, y: 370, text: `gait: ${derived.gaitClass}`, cls: 'caption' },
          ...(derived.involuntaryMovementIndex > 2
            ? [{ type: 'text' as const, x: 20, y: 390, text: `involuntary movement — chorea/ballism ${derived.involuntaryMovementIndex.toFixed(1)}`, cls: 'alarm' }]
            : []),
          { type: 'text', x: 20, y: 414, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 20, y: 434, text: derived.patternSummary, cls: 'label' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Movement command', key: 'movementCommandAmplitude', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Striatal dopamine', key: 'dopamineFraction', min: 0, max: 100, step: 1, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Indirect-pathway loss', key: 'striatalOutputLoss', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Subthalamic lesion', key: 'subthalamicLesion', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Cerebellar calibration', key: 'cerebellarCalibration', min: 0, max: 100, step: 1, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Corticospinal integrity', key: 'corticospinalIntegrity', min: 0, max: 100, step: 1, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Essential tremor drive', key: 'essentialTremorDrive', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Suppressant (beta-blocker/alcohol)', key: 'tremorSuppressantEffect', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Dystonic co-contraction', key: 'dystoniaSeverityPct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'Initiation latency',
        value: (c) => c.derived.initiationLatencyMs.toFixed(0),
        unit: 'ms',
        secondary: (c) => (c.derived.initiationLatencyMs > 500 ? 'bradykinesia — dopamine failure' : 'prompt start'),
        colorToken: 'basal-ganglia',
      },
      {
        label: 'Achieved amplitude',
        value: (c) => c.derived.achievedAmplitudePct.toFixed(0),
        unit: '% of command',
        secondary: (c) =>
          c.derived.amplitudeErrorPct > 25
            ? c.derived.dysmetriaPct > 15
              ? 'dysmetria dominates'
              : 'hypokinesia — micrographia territory'
            : 'on target',
        colorToken: 'basal-ganglia',
      },
      {
        label: 'Resting tremor',
        value: (c) => c.derived.restingTremorAmp.toFixed(1),
        secondary: (c) => (c.derived.restingTremorAmp > 2 ? '4-6 Hz, quiets on action' : 'silent'),
        colorToken: 'nociception',
      },
      {
        label: 'Intention tremor',
        value: (c) => c.derived.intentionTremorAmp.toFixed(1),
        secondary: (c) => (c.derived.intentionTremorAmp > 2 ? 'worse near the target' : 'absent'),
        colorToken: 'o2',
      },
      {
        label: 'Postural tremor',
        value: (c) => c.derived.posturalTremorAmp.toFixed(1),
        secondary: (c) => (c.derived.posturalTremorAmp > 2 ? 'against gravity, suppressant-responsive' : 'absent'),
        colorToken: 'warn',
      },
      {
        label: 'Involuntary movement',
        value: (c) => c.derived.involuntaryMovementIndex.toFixed(1),
        secondary: (c) =>
          c.derived.ballismAmp > c.derived.choreaAmp ? 'ballism (STN release)' : c.derived.choreaAmp > 1 ? 'chorea (striatal loss)' : 'none',
        colorToken: 'danger',
      },
      {
        label: 'Rigidity vs spasticity',
        value: (c) => `${c.derived.rigidityScore.toFixed(1)} / ${c.derived.spasticityScore.toFixed(1)}`,
        secondary: (c) =>
          c.derived.rigidityScore > c.derived.spasticityScore
            ? 'velocity-independent, cogwheel'
            : c.derived.spasticityScore > 3
              ? 'clasp-knife, velocity-dependent'
              : 'normal tone',
        colorToken: 'basal-ganglia',
      },
      {
        label: 'Co-contraction',
        value: (c) => c.derived.cocontractionIndex.toFixed(2),
        secondary: (c) => (c.derived.cocontractionIndex > 0.3 ? 'dystonic overflow — agonist recruits antagonist' : 'selective activation'),
        colorToken: 'o2',
      },
      { label: 'Gait', value: (c) => c.derived.gaitClass, colorToken: 'text' },
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
        label: 'Initiation latency',
        unit: 'ms',
        colorToken: 'basal-ganglia',
        domainMin: 0,
        domainMax: 1400,
        data: (points) => points.map((p) => p.latency),
      },
      {
        kind: 'sparkline',
        label: 'Resting tremor',
        colorToken: 'nociception',
        domainMin: 0,
        domainMax: 12,
        data: (points) => points.map((p) => p.restTremor),
      },
      {
        kind: 'sparkline',
        label: 'Involuntary movement',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 20,
        data: (points) => points.map((p) => p.involuntary),
      },
    ],
  };
}
