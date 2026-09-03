import { clamp, scaleClamped } from '@/shared/lib/math';
import { CONDUCTANCE, MEMBRANE } from './engine/constants';
import type { MembraneDerived, MembraneHistoryPoint, MembraneInputs, MembraneState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const PROPAGATION_PATH = 'M158,150 L378,150';
const DENDRITE_PATH = 'M-26,-8 L-46,-26 M-26,0 L-50,-2 M-26,8 L-46,22';
const AXON_SHAFT_PATH = 'M24,0 L212,0';
// The soma as a stroked circle centred on (0,0), radius 24.
const SOMA_PATH = 'M0,0 m-24,0 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0';
const MYELIN_SEGMENT_XS = [42, 86, 130, 174];
const MYELIN_BASE_Y = -9;
const MYELIN_BASE_H = 18;

type Ctx = PresentationContext<MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint>;

export function buildMembranePotentialsPresentation(ctx: Ctx): ModulePresentation<MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint> {
  const { derived } = ctx;

  const depolarization = clamp(scaleClamped(derived.vmMillivolts, derived.restingPotentialMv, MEMBRANE.MAX_MV, 0, 1), 0, 1);
  const gNaNormalized = clamp(derived.gNa / (CONDUCTANCE.MAX_GNA * 0.5), 0, 1);
  const gKNormalized = clamp(derived.gK / (CONDUCTANCE.MAX_GK * 0.5), 0, 1);
  // Propagation speed along the axon reflects the computed conduction velocity.
  const propagationSpeed = clamp(derived.conductionVelocityMPerS / 25, 0.05, 3);

  // Soma floods with sodium colour as the membrane depolarizes, so the upstroke is visible as a
  // colour change before the conducting trace beneath it moves.
  const somaFill = depolarization > 0.5 ? 'na-current' : 'k-current';
  // Myelin segments shrink toward bare axon as myelination falls (scaled about their centre).
  const myelinScaleY = 0.35 + Math.min(derived.myelination, 1) * 0.65;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Animated diagram of a neuron: the soma depolarizing during an action potential, sodium and potassium channels opening in sequence, and the impulse propagating along a myelinated axon',
        children: [
          { type: 'text', x: 24, y: 30, text: 'Equilibrium potentials', cls: 'pathLabel' },
          { type: 'text', x: 62, y: 50, text: `E(Na+) ${derived.eNa.toFixed(0)} mV`, cls: 'valueLabel' },
          { type: 'text', x: 62, y: 68, text: `E(K+) ${derived.eK.toFixed(0)} mV`, cls: 'valueLabel' },
          { type: 'text', x: 62, y: 86, text: `Rest ${derived.restingPotentialMv.toFixed(0)} mV`, cls: 'valueLabel' },

          {
            type: 'group',
            transform: 'translate(110,150)',
            styleVars: {
              'depolarization': depolarization,
              'gna': gNaNormalized,
              'gk': gKNormalized,
              'myelination': Math.min(derived.myelination, 1),
              'refractory': derived.isRefractory ? 1 : 0,
            },
            children: [
              { type: 'path', d: DENDRITE_PATH, colorToken: 'axon', strokeWidth: 2 },
              { type: 'path', d: SOMA_PATH, fill: somaFill, colorToken: 'axon', strokeWidth: 2 },
              { type: 'path', d: AXON_SHAFT_PATH, colorToken: 'axon', strokeWidth: 6 },
              ...MYELIN_SEGMENT_XS.map((segmentX) => ({
                type: 'rect' as const,
                x: segmentX,
                y: MYELIN_BASE_Y * myelinScaleY,
                width: 32,
                height: MYELIN_BASE_H * myelinScaleY,
                fill: 'axon',
              })),
              // Voltage-gated channels sitting in the membrane at a node of Ranvier. The sodium
              // and potassium conductances set their brightness, staged m³h-then-n⁴ across the
              // spike.
              { type: 'rect', x: 70, y: -26, width: 13, height: 13, fill: 'na-current' },
              { type: 'rect', x: 70, y: 14, width: 13, height: 13, fill: 'k-current' },
              { type: 'text', x: 90, y: -16, text: 'Na+', cls: 'pathLabel' },
              { type: 'text', x: 90, y: 25, text: 'K+', cls: 'pathLabel' },
              { type: 'text', x: 0, y: 48, text: 'Axon', cls: 'organLabel' },
              { type: 'text', x: 0, y: -40, text: 'Refractory', cls: 'alarm', anchor: 'middle', opacity: derived.isRefractory ? 1 : 0 },
            ],
          },

          { type: 'vessel', path: PROPAGATION_PATH, speed: propagationSpeed, colorToken: 'vm' },
          { type: 'text', x: 262, y: 182, text: `${derived.conductionVelocityMPerS.toFixed(0)} m/s`, cls: 'pathLabel' },

          { type: 'text', x: 400, y: 252, text: `Vm ${derived.vmMillivolts.toFixed(0)} mV`, cls: 'valueLabel', anchor: 'middle' },
          { type: 'text', x: 356, y: 272, text: `threshold ${derived.thresholdMv} mV`, cls: 'pathLabel' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Stimulus current', key: 'stimulusIntensity', min: 0, max: 50, step: 1 },
      { kind: 'slider', label: 'Extracellular K+', key: 'extracellularK', min: 2, max: 10, step: 0.1, unit: ' mEq/L' },
      { kind: 'slider', label: 'Extracellular Na+', key: 'extracellularNa', min: 100, max: 160, step: 1, unit: ' mEq/L' },
      { kind: 'slider', label: 'Na+ channel density', key: 'gNaMaxDensity', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'K+ channel density', key: 'gKMaxDensity', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Temperature', key: 'temperature', min: 30, max: 42, step: 0.5, unit: '°C' },
      { kind: 'slider', label: 'Myelination', key: 'myelination', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'Membrane potential',
        value: (c) => c.derived.vmMillivolts.toFixed(0),
        unit: 'mV',
        secondary: (c) => (c.derived.isRefractory ? 'refractory' : undefined),
        colorToken: 'vm',
      },
      { label: 'Resting potential', value: (c) => c.derived.restingPotentialMv.toFixed(0), unit: 'mV', colorToken: 'k-current' },
      { label: 'E(Na+)', value: (c) => c.derived.eNa.toFixed(0), unit: 'mV', colorToken: 'na-current' },
      { label: 'E(K+)', value: (c) => c.derived.eK.toFixed(0), unit: 'mV', colorToken: 'k-current' },
      { label: 'Na+ activation (m)', value: (c) => c.derived.gNaActivation.toFixed(2), colorToken: 'na-current' },
      {
        label: 'Na+ available (h)',
        value: (c) => c.derived.gNaInactivation.toFixed(2),
        secondary: () => 'excitability reserve',
        colorToken: 'na-current',
      },
      { label: 'K+ activation (n)', value: (c) => c.derived.gKActivation.toFixed(2), colorToken: 'k-current' },
      { label: 'Conduction velocity', value: (c) => c.derived.conductionVelocityMPerS.toFixed(0), unit: 'm/s', colorToken: 'axon' },
    ],
    charts: [
      { kind: 'sparkline', label: 'Membrane potential', unit: 'mV', colorToken: 'vm', domainMin: -100, domainMax: 60, data: (points) => points.map((p) => p.vm) },
      { kind: 'sparkline', label: 'Na+ conductance', colorToken: 'na-current', domainMin: 0, domainMax: CONDUCTANCE.MAX_GNA * 0.6, data: (points) => points.map((p) => p.gNa) },
      { kind: 'sparkline', label: 'K+ conductance', colorToken: 'k-current', domainMin: 0, domainMax: CONDUCTANCE.MAX_GK * 0.6, data: (points) => points.map((p) => p.gK) },
    ],
  };
}
