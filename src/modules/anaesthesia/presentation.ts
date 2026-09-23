import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
} from '@/shared/presentation/types';
import type {
  AnaesthesiaDerived,
  AnaesthesiaHistoryPoint,
  AnaesthesiaInputs,
  AnaesthesiaInternalState,
} from './engine/types';

type Ctx = PresentationContext<AnaesthesiaInternalState, AnaesthesiaDerived, AnaesthesiaInputs, AnaesthesiaHistoryPoint>;

/* Graphic constants shared by both frames. */
const W = 460;
const H = 250;

/** Which volatile the learner has dialed up, read off the blood:gas partition coefficient. */
function agentNameOf(lambda: number): string {
  if (lambda < 0.55) return 'desflurane';
  if (lambda < 1) return 'sevoflurane';
  if (lambda < 1.8) return 'isoflurane';
  return 'halothane';
}

/** The wash-in curve itself: alveolar level as a function of minutes, from the model the engine
 * integrates. Shown so the learner can see the whole slope the engine is living on. */
function washInCurve(d: AnaesthesiaDerived, xOf: (min: number) => number, yOf: (pct: number) => number): string {
  const points: string[] = [];
  const tauMin = d.timeTo90PctMinutes / Math.log(10);
  const ceiling = d.alveolarAgentPct / Math.max(d.washInProgress, 0.001);
  for (let t = 0; t <= 15; t += 0.25) {
    const y = ceiling * (1 - Math.exp(-t / tauMin));
    points.push(`${xOf(t).toFixed(1)},${yOf(y).toFixed(1)}`);
  }
  return points.join(' ');
}

/** Frame 1 — the wash-in: the rising alveolar curve against its ceiling, with the current alveolar
 * and effect-site positions on it. */
function washInFrame(ctx: Ctx): FrameNode {
  const { derived, state } = ctx;

  const xOf = (min: number): number => 46 + Math.min(Math.max(min, 0), 15) * (W - 52) / 15;
  const yOf = (pct: number): number => 214 - Math.min(Math.max(pct, 0), 8) * (172 / 8);

  const ceiling = derived.alveolarAgentPct / Math.max(derived.washInProgress, 0.001);
  const currentMinutes = Math.min(state.simTimeSeconds / 60, 15);
  const t90 = derived.timeTo90PctMinutes;

  /* Which side of the moving dot its label sits on.
   *
   * The dot walks to the right-hand edge as the wash-in completes — and this module SETTLES for
   * nine hundred seconds, so it opens with the dot already at fifteen minutes and both labels
   * hanging fifty pixels off the frame. `DiagramFrame` clips with `overflow: hidden`, so they were
   * simply gone. Flipping to the inside past two thirds of the axis keeps them on the plot at every
   * point of the curve rather than at a hand-picked one.
   */
  const labelFlipped = currentMinutes > 10;
  const labelX = xOf(currentMinutes) + (labelFlipped ? -9 : 9);
  const labelAnchor = labelFlipped ? ('end' as const) : ('start' as const);

  return {
    type: 'frame',
    key: 'anaesthesia-washin',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The alveolar wash-in curve rising toward the equilibrium ceiling, with the current alveolar and effect-site positions',
    children: [
      { type: 'text', x: W / 2, y: 26, text: derived.state, cls: 'verdict', anchor: 'middle', colorToken: 'o2' },

      // The equilibrium ceiling the curve tends to.
      { type: 'line', x1: xOf(0), y1: yOf(ceiling), x2: xOf(15), y2: yOf(ceiling), cls: 'axis' },
      /* At the END OF THE LINE THE DOT IS NOT ON. Once the wash-in equilibrates the alveolar level
       * IS the ceiling — that is what equilibrium means — so the two labels converge on the same
       * point and no fixed placement separates them. Sending the ceiling to the opposite end keeps
       * them apart through the whole curve. */
      {
        type: 'text',
        x: labelFlipped ? xOf(0) : xOf(15),
        y: yOf(ceiling) - 5,
        text: `ceiling ${ceiling.toFixed(1)}%`,
        cls: 'tickLabel',
        anchor: labelFlipped ? 'start' : 'end',
      },

      // The wash-in curve and the t90 marker on it.
      { type: 'path', d: `M ${washInCurve(derived, xOf, yOf)}`, colorToken: 'o2', fill: 'none', strokeWidth: 2 },
      { type: 'line', x1: xOf(t90), y1: yOf(0) + 4, x2: xOf(t90), y2: yOf(0.9 * ceiling), cls: 'axis' },
      /* On the TOP of its own marker line, not under the axis: at y=232 it shared a baseline with
       * the minute ticks at 236, and where it lands depends on t90 — so no fixed horizontal offset
       * can clear the "5 min" tick for every wash-in. Four units of vertical separation is the
       * collision CLAUDE.md warns a sweep will find and the eye reads as one phrase. */
      { type: 'text', x: xOf(t90), y: yOf(0.9 * ceiling) - 6, text: `t90 ${t90.toFixed(1)} min`, cls: 'tickLabel', anchor: 'middle', halo: 'panel' },

      // Where the alveolar level and the effect site currently sit.
      { type: 'circle', cx: xOf(currentMinutes), cy: yOf(derived.alveolarAgentPct), r: 6, fill: 'o2', stroke: 'panel', strokeWidth: 2 },
      { type: 'text', x: labelX, y: yOf(derived.alveolarAgentPct) - 6, text: `alveolar ${derived.alveolarAgentPct.toFixed(2)}%`, cls: 'valueLabel', colorToken: 'o2', anchor: labelAnchor, halo: 'panel' },
      { type: 'circle', cx: xOf(currentMinutes), cy: yOf(derived.effectSiteAgentPct), r: 5, fill: 'vm', stroke: 'panel', strokeWidth: 2 },
      { type: 'text', x: labelX, y: yOf(derived.effectSiteAgentPct) + 12, text: `brain ${derived.effectSiteAgentPct.toFixed(2)}%`, cls: 'valueLabel', colorToken: 'vm', anchor: labelAnchor, halo: 'panel' },

      // Axes.
      { type: 'text', x: xOf(0), y: 236, text: '0', cls: 'tickLabel' },
      { type: 'text', x: xOf(5), y: 236, text: '5 min', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: xOf(10), y: 236, text: '10', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: xOf(15), y: 236, text: '15 min', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: 6, y: yOf(0) + 3, text: '0', cls: 'tickLabel' },
      { type: 'text', x: 6, y: yOf(4), text: '4%', cls: 'tickLabel' },
      { type: 'text', x: W / 2, y: H - 2, text: 'minutes since change →   alveolar agent (%) ↑', cls: 'caption', anchor: 'middle' },
    ],
  };
}

/** Frame 2 — the circle system: fresh gas into a rebreathing loop, the dial, and how much actually
 * reaches the patient. The copy of every control lives somewhere in this picture. */
function circuitFrame(ctx: Ctx): FrameNode {
  const { derived, inputs } = ctx;

  const loopX = 250;
  const loopY = 110;
  const loopW = 190;
  const loopH = 84;

  const arrowWidth = 4 + (inputs.freshGasFlowLMin / 10) * 22;
  const agent = agentNameOf(inputs.bloodGasSolubility);

  return {
    type: 'frame',
    key: 'anaesthesia-circuit',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The circle breathing system: vaporizer, fresh gas flow, rebreathing loop and the inspired concentration reaching the lungs',
    children: [
      // Vaporizer.
      { type: 'rect', x: 16, y: 70, width: 66, height: 84, fill: 'raas', fillOpacity: 0.18 },
      { type: 'text', x: 49, y: 96, text: 'vaporizer', cls: 'label', anchor: 'middle' },
      { type: 'text', x: 49, y: 118, text: `${derived.dialPct.toFixed(1)}%`, cls: 'valueLabel', anchor: 'middle', colorToken: 'raas' },
      { type: 'text', x: 49, y: 136, text: agent, cls: 'caption', anchor: 'middle' },

      // Fresh gas arrow into the loop — its thickness carries the flow.
      { type: 'path', d: 'M 82 112 L 170 112', colorToken: 'o2', fill: 'none', strokeWidth: arrowWidth },
      { type: 'text', x: 126, y: 98, text: `${inputs.freshGasFlowLMin.toFixed(1)} L/min`, cls: 'tickLabel', anchor: 'middle', colorToken: 'o2' },

      // The rebreathing loop with its CO2 absorber.
      { type: 'rect', x: loopX, y: loopY, width: loopW, height: loopH, fill: 'panel', fillOpacity: 0.6 },
      { type: 'text', x: loopX + 12, y: loopY + 16, text: 'CO2 absorber', cls: 'caption' },
      { type: 'text', x: loopX + 12, y: loopY + 34, text: `inspired ${derived.inspiredFractionPct.toFixed(2)}%`, cls: 'valueLabel', colorToken: 'vq' },

      // The patient: lungs taking the inspired fraction, brain fed by the effect site.
      { type: 'circle', cx: 362, cy: 214, r: 26, fill: 'o2', fillOpacity: 0.22 },
      { type: 'text', x: 362, y: 218, text: 'lungs', cls: 'label', anchor: 'middle' },
      { type: 'circle', cx: 300, cy: 214, r: 20, fill: 'panel', fillOpacity: 0.6 },
      { type: 'text', x: 300, y: 218, text: 'brain', cls: 'label', anchor: 'middle' },
      { type: 'text', x: 300, y: 204, text: `${derived.effectSiteAgentPct.toFixed(2)}%`, cls: 'tickLabel', anchor: 'middle', colorToken: 'vm' },

      // Cardiac output tag — the flow refilling the sink.
      { type: 'text', x: 40, y: 40, text: `cardiac output ${inputs.cardiacOutputLMin.toFixed(1)} L/min`, cls: 'caption' },
      { type: 'text', x: 40, y: 58, text: `delivered ${(derived.inspiredToDialRatio * 100).toFixed(0)}% of the dial`, cls: 'caption' },
    ],
  };
}

export function buildAnaesthesiaPresentation(ctx: Ctx): ModulePresentation<AnaesthesiaInternalState, AnaesthesiaDerived, AnaesthesiaInputs, AnaesthesiaHistoryPoint> {
  return {
    diagram: [washInFrame(ctx), circuitFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Agent dial', key: 'dialPct', min: 0, max: 8, step: 0.5, unit: ' %' },
      { kind: 'slider', label: 'Fresh gas flow', key: 'freshGasFlowLMin', min: 1, max: 10, step: 0.5, unit: ' L/min' },
      { kind: 'slider', label: 'Blood:gas solubility', key: 'bloodGasSolubility', min: 0.4, max: 2.4, step: 0.05, unit: '' },
      { kind: 'slider', label: 'Cardiac output', key: 'cardiacOutputLMin', min: 2.5, max: 8, step: 0.5, unit: ' L/min' },
    ],
    readouts: [
      {
        label: 'Alveolar concentration',
        value: (c) => c.derived.alveolarAgentPct.toFixed(2),
        unit: '%',
        colorToken: 'o2',
        secondary: (c) => `against a ${(c.derived.alveolarAgentPct / Math.max(c.derived.washInProgress, 0.001)).toFixed(2)}% ceiling`,
      },
      {
        label: 'Effect-site (brain)',
        value: (c) => c.derived.effectSiteAgentPct.toFixed(2),
        unit: '%',
        colorToken: 'vm',
        secondary: (c) => `${agentNameOf(c.derived.bloodGasSolubility)} effect-site`,
      },
      {
        label: 'Wash-in progress',
        value: (c) => (c.derived.washInProgress * 100).toFixed(0),
        unit: '%',
        colorToken: 'vq',
        secondary: (c) => (c.derived.washInProgress < 0.5 ? 'induction still gathering' : c.derived.washInProgress < 0.9 ? 'rising toward the ceiling' : 'equilibrated'),
      },
      {
        label: 'Inspired fraction',
        value: (c) => c.derived.inspiredFractionPct.toFixed(2),
        unit: '%',
        colorToken: 'o2',
        secondary: (c) => `${(c.derived.inspiredToDialRatio * 100).toFixed(0)}% of the dial at the Y-piece`,
      },
      {
        label: 'Minutes to 90%',
        value: (c) => c.derived.timeTo90PctMinutes.toFixed(1),
        unit: ' min',
        colorToken: 'vq',
        secondary: (c) => `${agentNameOf(c.derived.bloodGasSolubility)} at current flow`,
      },
      {
        label: 'Agent absorption',
        value: (c) => c.derived.absorptionIndex.toFixed(1),
        unit: ' index',
        colorToken: 'raas',
        secondary: () => 'solubility × cardiac output × alveolar',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Alveolar agent',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 8,
        data: (points) => points.map((p) => p.alveolar),
      },
      {
        kind: 'sparkline',
        label: 'Effect-site agent',
        unit: '%',
        colorToken: 'vm',
        domainMin: 0,
        domainMax: 8,
        data: (points) => points.map((p) => p.brain),
      },
    ],
  };
}