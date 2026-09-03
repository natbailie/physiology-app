import { clamp } from '@/shared/lib/math';
import type {
  SomaticDerived,
  SomaticHistoryPoint,
  SomaticInputs,
  SomaticInternalState,
} from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/**
 * The spinal cord in cross-section, and the two places sensory fibres cross the midline.
 *
 * Every preset in this module is a lesion defined by WHERE in the cord it sits — Brown-Séquard,
 * anterior cord, syringomyelia, transection. The cord has grey matter, a central canal, and its
 * tracts positioned where they belong: dorsal columns posteromedially, spinothalamic
 * anterolaterally. The inset beside it makes Brown-Séquard legible: pain and temperature cross
 * within a segment or two of entering, vibration and touch stay ipsilateral to the medulla, so a
 * hemisection takes vibration on the SAME side and pain on the OTHER.
 */
const CORD = { cx: 146, cy: 150, r: 88 };
const RAD = Math.PI / 180;

/** A wedge of white matter between two radii, positioned by angle — 0° lateral, -90° dorsal,
 * +90° ventral. */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) =>
    `${(CORD.cx + r * Math.cos(a * RAD)).toFixed(1)} ${(CORD.cy + r * Math.sin(a * RAD)).toFixed(1)}`;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

/** Ellipse path in absolute coordinates (rx, ry differ for the dorsal horn and the syrinx). */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${(cx).toFixed(2)},${(cy - ry).toFixed(2)} a ${rx},${ry} 0 1,1 0,${(2 * ry).toFixed(2)} a ${rx},${ry} 0 1,1 0,${(-2 * ry).toFixed(2)}`;
}

/** Full-circle path for the cord outline, so the stroke and fill can both be set. */
function circlePath(cx: number, cy: number, r: number): string {
  return `M ${(cx - r).toFixed(2)},${cy.toFixed(2)} a ${r},${r} 0 1,0 ${(2 * r).toFixed(2)},0 a ${r},${r} 0 1,0 ${(-2 * r).toFixed(2)},0`;
}

/** Half of the grey-matter butterfly, in cord-local coordinates. Mirrored for the other side. */
const GREY_HALF =
  'M 5 -54 C 16 -55, 27 -46, 29 -32 C 32 -20, 34 -12, 30 -4 C 42 2, 52 16, 47 30 ' +
  'C 42 44, 22 46, 15 34 C 9 25, 8 14, 8 6 L 5 6 Z';

/** A front-facing silhouette, used twice: once per modality, shaded per side by what is lost. */
const BODY =
  'M 32 2 a 11 11 0 1 1 -0.1 0 M 22 24 L 42 24 C 48 24 50 28 50 34 L 58 66 L 50 70 L 46 44 ' +
  'L 46 72 L 42 118 L 34 118 L 32 78 L 30 118 L 22 118 L 18 72 L 18 44 L 14 70 L 6 66 ' +
  'L 14 34 C 14 28 16 24 22 24 Z';

const PAIN_FIBRE = 'M 486 168 L 486 156 C 486 142 470 138 448 138 L 366 138 C 348 138 344 130 344 116 L 344 56';
const TOUCH_FIBRE = 'M 524 168 L 524 92 C 524 78 512 72 494 72 L 400 72 C 384 72 378 68 378 56';

/** Percentage preserved to the opacity of the "lost" wash over that half of the body. */
const lossOpacity = (preservedPct: number): number => clamp((100 - preservedPct) / 100, 0, 1);

type Ctx = PresentationContext<SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint>;

/** A body map: the silhouette clipped to two loss washes, one per side of the body. */
function bodyMapFrame(
  x: number,
  y: number,
  title: string,
  leftPct: number,
  rightPct: number,
  clipId: string,
): FrameNode['children'][number] {
  return {
    type: 'group',
    transform: `translate(${x}, ${y})`,
    children: [
      { type: 'text', x: 32, y: -8, text: title, cls: 'anatomy', anchor: 'middle' },
      /* Patient's right is the viewer's left, matching the cord above. */
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 32,
        height: 120,
        fill: 'danger',
        clipPathId: clipId,
        styleVars: { opacity: lossOpacity(rightPct) },
      },
      {
        type: 'rect',
        x: 32,
        y: 0,
        width: 32,
        height: 120,
        fill: 'danger',
        clipPathId: clipId,
        styleVars: { opacity: lossOpacity(leftPct) },
      },
      { type: 'path', d: BODY, fill: 'none', colorToken: 'text-faint', strokeWidth: 1.2 },
      { type: 'text', x: 8, y: 132, text: `R ${rightPct.toFixed(0)}%`, cls: 'tickLabel' },
      { type: 'text', x: 56, y: 132, text: `L ${leftPct.toFixed(0)}%`, cls: 'tickLabel' },
    ],
  };
}

export function buildSomaticSensationPresentation(ctx: Ctx): ModulePresentation<SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint> {
  const { derived } = ctx;

  // A tract's shading is its integrity. Dorsal columns carry their own side; a spinothalamic
  // tract carries the OTHER side's pain, which is exactly the confusion the inset resolves.
  const dcRight = derived.touchRightPct;
  const dcLeft = derived.touchLeftPct;
  const stRightCarriesLeftPain = derived.painTempLeftPct;
  const stLeftCarriesRightPain = derived.painTempRightPct;

  const gate = clamp(derived.gateOpenFraction, 0, 1);
  const syrinx = clamp((100 - derived.segmentalPainTempPct) / 100, 0, 1);
  const integrity = (pct: number) => ({ integrity: clamp(pct / 100, 0, 1) });

  const dorsalHorn = (side: number) => ({
    type: 'path' as const,
    d: ellipsePath(side, -38, 11, 13),
    fill: 'nociception' as const,
    strokeWidth: 1,
    colorToken: 'nociception' as const,
    styleVars: { gate },
  });

  const cordGroup: FrameNode['children'][number] = {
    type: 'group',
    children: [
      // Dorsal columns: posteromedial, either side of the posterior median septum.
      { type: 'path', d: sector(46, 84, -145, -95), fill: 'axon', styleVars: integrity(dcRight) },
      { type: 'path', d: sector(46, 84, -85, -35), fill: 'axon', styleVars: integrity(dcLeft) },
      // Spinothalamic: anterolateral.
      { type: 'path', d: sector(48, 84, 105, 155), fill: 'nociception', styleVars: integrity(stRightCarriesLeftPain) },
      { type: 'path', d: sector(48, 84, 25, 75), fill: 'nociception', styleVars: integrity(stLeftCarriesRightPain) },
      // Grey matter, drawn as one half mirrored, with the commissure joining them.
      { type: 'path', d: GREY_HALF, fill: 'nociception' },
      { type: 'path', d: GREY_HALF, fill: 'nociception', styleVars: { sx: -1 } },
      { type: 'rect', x: -6, y: -9, width: 12, height: 18, fill: 'nociception' },
      // The dorsal horn is where the gate acts.
      dorsalHorn(-24),
      dorsalHorn(24),
      { type: 'circle', cx: 0, cy: 0, r: 3.5, fill: 'panel' },
      // A syrinx expands from the central canal into the anterior commissure, taking the crossing
      // pain fibres of those segments — the cape.
      ...(syrinx > 0.03
        ? [
            {
              type: 'path' as const,
              d: ellipsePath(0, 1, 4 + syrinx * 26, 3 + syrinx * 13),
              fill: 'panel' as const,
              colorToken: 'danger' as const,
              strokeWidth: 1.5,
            },
          ]
        : []),
    ],
  };

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'Spinal cord in cross-section with the dorsal columns and spinothalamic tracts, the levels at which each crosses the midline, and the resulting modality loss on each side of the body',
        defs: [
          { type: 'clipPath', id: 'somaticBodyDc', children: [{ type: 'path', d: BODY }] },
          { type: 'clipPath', id: 'somaticBodySt', children: [{ type: 'path', d: BODY }] },
        ],
        children: [
          /* ---- Cord cross-section ---- */
          { type: 'text', x: CORD.cx, y: 30, text: 'Cord below the lesion', cls: 'anatomyStrong', anchor: 'middle' },
          { type: 'path', d: circlePath(CORD.cx, CORD.cy, CORD.r), fill: 'panel-raised', colorToken: 'panel-border', strokeWidth: 1.5 },
          {
            type: 'group',
            transform: `translate(${CORD.cx}, ${CORD.cy})`,
            children: [
              ...(cordGroup.type === 'group' ? cordGroup.children : []),
            ],
          },
          { type: 'text', x: CORD.cx - 66, y: CORD.cy + 106, text: 'Right', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: CORD.cx + 66, y: CORD.cy + 106, text: 'Left', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: CORD.cx, y: CORD.cy - 96, text: 'Dorsal columns', cls: 'anatomy', anchor: 'middle' },
          { type: 'text', x: CORD.cx, y: CORD.cy + 122, text: 'Spinothalamic', cls: 'anatomy', anchor: 'middle' },

          /* ---- Where each modality crosses ---- */
          { type: 'text', x: 258, y: 44, text: 'Where each crosses', cls: 'anatomyStrong' },
          { type: 'line', x1: 266, y1: 72, x2: 548, y2: 72, cls: 'axis' },
          { type: 'text', x: 266, y: 66, text: 'Medulla', cls: 'tickLabel' },
          { type: 'line', x1: 266, y1: 168, x2: 548, y2: 168, cls: 'axis' },
          { type: 'text', x: 266, y: 182, text: 'Cord segment · fibres enter here', cls: 'tickLabel' },
          { type: 'line', x1: 407, y1: 56, x2: 407, y2: 176, colorToken: 'text-faint' },
          // Pain and temperature: synapses and crosses at the segment, ascends contralaterally.
          { type: 'path', d: PAIN_FIBRE, fill: 'none', colorToken: 'nociception', strokeWidth: 2.5 },
          { type: 'text', x: 492, y: 158, text: 'pain', cls: 'pathLabel', colorToken: 'nociception' },
          // Vibration and touch: ipsilateral the whole way, crossing only in the medulla.
          { type: 'path', d: TOUCH_FIBRE, fill: 'none', colorToken: 'axon', strokeWidth: 2.5 },
          { type: 'text', x: 530, y: 158, text: 'touch', cls: 'pathLabel', colorToken: 'axon' },
          {
            type: 'text',
            x: 266,
            y: 204,
            text: 'pain crosses at the segment · touch crosses in the medulla',
            cls: 'caption',
          },

          /* ---- What survives below, per side ---- */
          bodyMapFrame(286, 252, 'Vibration & touch', dcLeft, dcRight, 'somaticBodyDc'),
          bodyMapFrame(440, 252, 'Pain & temperature', derived.painTempLeftPct, derived.painTempRightPct, 'somaticBodySt'),

          /* ---- Readouts ---- */
          { type: 'text', x: 20, y: 286, text: `Dorsal horn gate ${Math.round(gate * 100)}% open`, cls: 'label' },
          {
            type: 'text',
            x: 20,
            y: 304,
            text: `C-fibre ${derived.cFibreTraffic.toFixed(0)} · Aδ ${derived.adDeltaTraffic.toFixed(0)} · Aβ ${derived.abTraffic.toFixed(0)}`,
            cls: 'caption',
          },
          {
            type: 'text',
            x: 20,
            y: 332,
            text: `first pain ${derived.firstPainLatencyMs.toFixed(0)} ms · second ${derived.secondPainLatencyMs.toFixed(0)} ms`,
            cls: 'caption',
          },
          { type: 'text', x: 20, y: 358, text: `pain ${derived.perceivedPainScore.toFixed(1)}/10`, colorToken: 'text' },
          ...(derived.allodyniaActive
            ? [{ type: 'text' as const, x: 20, y: 382, text: 'allodynia — Aβ now driving pain', cls: 'alarm' as const }]
            : []),
          { type: 'text', x: 20, y: 410, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 20, y: 430, text: derived.patternSummary, cls: 'label' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Touch stimulus (Aβ)', key: 'touchStimulusDrive', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Nociceptive drive', key: 'nociceptiveStimulusDrive', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Rubbing / counterstimulus', key: 'rubbingGateDrive', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Descending modulation', key: 'descendingModulation', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Local anaesthetic block', key: 'localAnaestheticBlock', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Peripheral sensitisation', key: 'peripheralSensitisation', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Central wind-up gain', key: 'windUpGain', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Left hemicord lesion', key: 'leftHemisectionSeverity', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Right hemicord lesion', key: 'rightHemisectionSeverity', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Anterior quadrants', key: 'anteriorQuadrantSeverity', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Central canal (syrinx)', key: 'centralCanalSeverity', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'Pain score',
        value: (c) => c.derived.perceivedPainScore.toFixed(1),
        unit: '/10',
        secondary: (c) => (c.derived.allodyniaActive ? 'includes pain from touch' : 'transmission-cell output'),
        colorToken: 'nociception',
      },
      {
        label: 'Gate',
        value: (c) => (c.derived.gateOpenFraction * 100).toFixed(0),
        unit: '% open',
        secondary: (c) => (c.derived.gateOpenFraction > 0.5 ? 'nociceptive traffic passing' : 'inhibitory interneurons winning'),
        colorToken: 'warn',
      },
      {
        label: 'C-fibre traffic',
        value: (c) => c.derived.cFibreTraffic.toFixed(0),
        secondary: (c) => `second pain ${c.derived.secondPainLatencyMs.toFixed(0)} ms`,
        colorToken: 'danger',
      },
      {
        label: 'Aβ traffic',
        value: (c) => c.derived.abTraffic.toFixed(0),
        secondary: (c) => `touch ${c.derived.touchLatencyMs.toFixed(0)} ms — closes the gate`,
        colorToken: 'o2',
      },
      {
        label: 'Touch below (L/R)',
        value: (c) => `${c.derived.touchLeftPct.toFixed(0)}/${c.derived.touchRightPct.toFixed(0)}`,
        unit: '%',
        secondary: () => 'dorsal columns, ipsilateral',
        colorToken: 'o2',
      },
      {
        label: 'Pain/temp below (L/R)',
        value: (c) => `${c.derived.painTempLeftPct.toFixed(0)}/${c.derived.painTempRightPct.toFixed(0)}`,
        unit: '%',
        secondary: () => 'spinothalamics, already crossed',
        colorToken: 'nociception',
      },
      {
        label: 'Segmental pain/temp',
        value: (c) => c.derived.segmentalPainTempPct.toFixed(0),
        unit: '%',
        secondary: () => 'syrinx level (arms before legs)',
        colorToken: 'nociception',
      },
      {
        label: 'Proprioception below',
        value: (c) => `${Math.min(c.derived.proprioceptionLeftPct, c.derived.proprioceptionRightPct).toFixed(0)}%`,
        secondary: () => 'travels with touch',
        colorToken: 'o2',
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
        label: 'Pain score',
        unit: '/10',
        colorToken: 'nociception',
        domainMin: 0,
        domainMax: 10,
        data: (points) => points.map((p) => p.pain),
      },
      {
        kind: 'sparkline',
        label: 'Gate',
        unit: '% open',
        colorToken: 'warn',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.gate),
      },
      {
        kind: 'sparkline',
        label: 'Peripheral sensitisation',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.sensitisation),
      },
    ],
  };
}
