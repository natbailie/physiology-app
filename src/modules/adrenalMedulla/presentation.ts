import { clamp } from '@/shared/lib/math';
import type { MedullaDerived, MedullaHistoryPoint, MedullaInputs, MedullaInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint>;

/** A rectangle drawn as a path so it can carry a stroke colour, width and rounded corners —
 * the RectNode type has no stroke/rx, and the frame outlines need them. */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    'Z',
  ].join(' ');
}

export function buildAdrenalMedullaPresentation(ctx: Ctx): ModulePresentation<MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint> {
  const { derived, inputs } = ctx;
  const alphaPct = clamp(inputs.alphaBlockadePct / 100, 0, 1);
  const betaPct = clamp(inputs.betaBlockadePct / 100, 0, 1);
  const naPct = clamp(derived.plasmaNa / 120, 0, 1);
  const adPct = clamp(derived.plasmaAd / 120, 0, 1);
  const mapPct = clamp((derived.mapMmHg - 60) / 160, 0, 1);

  const unopposedDanger = betaPct > 0.4 && alphaPct < 0.25 && derived.mapMmHg > 160;

  const cathecolamineBars: SceneNode[] = [
    { label: 'NA', value: naPct, text: derived.plasmaNa.toFixed(0), i: 0, colorToken: 'adrenal-medulla' },
    { label: 'AD', value: adPct, text: derived.plasmaAd.toFixed(0), i: 1, colorToken: 'epinephrine' },
  ].map((c) => ({
    type: 'group' as const,
    children: [
      {
        type: 'path' as const,
        d: roundedRect(56 + c.i * 70, 58, 34, 110, 5),
        fill: 'none',
        colorToken: 'panel-border',
        strokeWidth: 1,
      },
      {
        type: 'rect' as const,
        x: 59 + c.i * 70,
        y: 165 - c.value * 104,
        width: 28,
        height: c.value * 104,
        fill: c.colorToken,
      },
      {
        type: 'text' as const,
        x: 54 + c.i * 70,
        y: 186,
        text: `${c.label} ${c.text}`,
        cls: 'caption',
      },
    ],
  }));

  const triadLine =
    `triad: headache ${derived.triadHeadache ? '✓' : '·'} · sweating ${derived.triadSweating ? '✓' : '·'} · palpitations ${derived.triadPalpitations ? '✓' : '·'} (${derived.triadCount}/3)`;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Receptor blockade meters and catecholamine-driven haemodynamics',
        children: [
          { type: 'text', x: 44, y: 44, text: 'Plasma catecholamines', cls: 'label' },
          ...cathecolamineBars,
          {
            type: 'text',
            x: 210,
            y: 92,
            text: `NA share of secretion ${inputs.noradrenalineFractionPct.toFixed(0)}%`,
            cls: 'caption',
          },
          { type: 'text', x: 320, y: 44, text: 'Receptor blockade', cls: 'label' },
          { type: 'text', x: 320, y: 76, text: `α-blockade ${inputs.alphaBlockadePct.toFixed(0)}%`, cls: 'caption' },
          { type: 'path', d: roundedRect(320, 82, 200, 18, 5), fill: 'none', colorToken: 'panel-border', strokeWidth: 1 },
          { type: 'rect', x: 320, y: 82, width: 200 * alphaPct, height: 18, fill: 'ok' },
          { type: 'text', x: 320, y: 126, text: `β-blockade ${inputs.betaBlockadePct.toFixed(0)}%`, cls: 'caption' },
          { type: 'path', d: roundedRect(320, 132, 200, 18, 5), fill: 'none', colorToken: 'panel-border', strokeWidth: 1 },
          { type: 'rect', x: 320, y: 132, width: 200 * betaPct, height: 18, fill: 'o2' },
          ...(unopposedDanger
            ? [{ type: 'text' as const, x: 320, y: 170, text: 'Unopposed alpha — pressure rising', cls: 'alarm' }]
            : []),
          { type: 'text', x: 44, y: 228, text: 'Haemodynamics', cls: 'label' },
          { type: 'path', d: roundedRect(44, 236, 476, 16, 4), fill: 'none', colorToken: 'panel-border', strokeWidth: 1 },
          {
            type: 'rect',
            x: 44,
            y: 236,
            width: mapPct * 476,
            height: 16,
            fill: derived.mapMmHg > 150 ? 'danger' : 'artery',
          },
          {
            type: 'text',
            x: 44,
            y: 272,
            text: `MAP ${derived.mapMmHg.toFixed(0)} mmHg · HR ${derived.heartRateBpm.toFixed(0)} bpm · volume ${derived.bloodVolumePct.toFixed(0)}% · orthostatic drop ${derived.orthostaticDropMmHg.toFixed(0)} mmHg`,
            cls: 'caption',
          },
          { type: 'text', x: 44, y: 296, text: triadLine, cls: 'caption' },
          ...(derived.arrhythmiaRiskPct > 45
            ? [{ type: 'text' as const, x: 44, y: 314, text: `arrhythmia risk ${derived.arrhythmiaRiskPct.toFixed(0)}%`, cls: 'alarm' }]
            : []),
          { type: 'text', x: 44, y: 352, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 44, y: 374, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Tumour secretion', key: 'tumourSecretionRate', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Noradrenaline share', key: 'noradrenalineFractionPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Alpha blockade', key: 'alphaBlockadePct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Beta blockade', key: 'betaBlockadePct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'MAP',
        value: (c) => c.derived.mapMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => (c.derived.mapMmHg > 150 ? 'catecholamine-driven' : c.derived.mapMmHg > 110 ? 'sustained rise' : 'controlled'),
        colorToken: 'artery',
      },
      {
        label: 'Heart rate',
        value: (c) => c.derived.heartRateBpm.toFixed(0),
        unit: 'bpm',
        secondary: (c) =>
          c.derived.heartRateBpm > 95
            ? 'beta-dominated — adrenaline talking'
            : c.derived.mapMmHg > 125
              ? 'reflex-slowed by pressure'
              : 'ordinary',
        colorToken: 'epinephrine',
      },
      {
        label: 'Orthostatic drop',
        value: (c) => c.derived.orthostaticDropMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => `plasma volume ${c.derived.bloodVolumePct.toFixed(0)}% — contracted by chronic vasoconstriction`,
        colorToken: 'venous',
      },
      {
        label: 'Arrhythmia risk',
        value: (c) => c.derived.arrhythmiaRiskPct.toFixed(0),
        unit: '%',
        secondary: () => 'beta effects unopposed raise this',
        colorToken: 'danger',
      },
      {
        label: 'Classical triad',
        value: (c) => `${c.derived.triadCount}/3`,
        secondary: (c) =>
          `${c.derived.triadHeadache ? 'headache ' : ''}${c.derived.triadSweating ? 'sweating ' : ''}${c.derived.triadPalpitations ? 'palpitations' : ''}`.trim() || 'none present',
        colorToken: 'warn',
      },
      {
        label: 'Paroxysm',
        value: (c) => (c.derived.paroxysmActive ? 'active' : 'quiet'),
        secondary: () => 'events, not states — metanephrines integrate them',
        colorToken: 'nociception',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        wide: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'MAP',
        unit: 'mmHg',
        colorToken: 'artery',
        domainMin: 60,
        domainMax: 230,
        data: (points) => points.map((p) => p.map),
      },
      {
        kind: 'sparkline',
        label: 'Heart rate',
        unit: 'bpm',
        colorToken: 'epinephrine',
        domainMin: 40,
        domainMax: 160,
        data: (points) => points.map((p) => p.hr),
      },
      {
        kind: 'sparkline',
        label: 'Plasma volume',
        unit: '%',
        colorToken: 'venous',
        domainMin: 80,
        domainMax: 102,
        data: (points) => points.map((p) => p.volume),
      },
    ],
  };
}
