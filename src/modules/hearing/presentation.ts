import { clamp } from '@/shared/lib/math';
import { AUDIOGRAM_FREQS_HZ, CLINICAL } from './engine/constants';
import type { HearingDerived, HearingHistoryPoint, HearingInputs, HearingInternalState } from './engine/types';
import type { FrameNode, PathNode, SceneNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* --- The ear diagram, faithfully translated from HearingDiagram.tsx ------------------- */

/** The cochlea, unrolled. Base at the left beside the oval window carries high frequencies;
 *  the apex at the right carries low ones. */
const COCHLEA = { x0: 284, x1: 500, cy: 196, baseHalf: 31, apexHalf: 13 };
const SEGMENTS = AUDIOGRAM_FREQS_HZ.length;
const SEG_W = (COCHLEA.x1 - COCHLEA.x0) / SEGMENTS;

/** Half-height of the unrolled duct at a fractional distance from the base. */
function half(p: number): number {
  return COCHLEA.baseHalf - (COCHLEA.baseHalf - COCHLEA.apexHalf) * p;
}

/** Place of a frequency along the unrolled duct: 8 kHz at the base, 250 Hz at the apex. */
function placeOf(hz: number): number {
  const t = Math.log2(clamp(hz, 250, 8000) / 250) / Math.log2(8000 / 250);
  return 1 - t; // 0 at the base (high frequency), 1 at the apex (low)
}

/** The unrolled basilar-membrane duct outline. */
function ductPath(): string {
  return `M ${COCHLEA.x0} ${COCHLEA.cy - COCHLEA.baseHalf} L ${COCHLEA.x1} ${COCHLEA.cy - COCHLEA.apexHalf} L ${COCHLEA.x1} ${COCHLEA.cy + COCHLEA.apexHalf} L ${COCHLEA.x0} ${COCHLEA.cy + COCHLEA.baseHalf} Z`;
}

/**
 * The travelling wave: a skewed envelope peaking at the stimulus frequency's place, with the
 * envelope bulging toward the apex (the `1 - 0.3 * t` roll-off) as in the real cochlea.
 */
function travellingWavePath(stimulusFrequencyHz: number, sensationLevelDb: number): string {
  const place = placeOf(stimulusFrequencyHz);
  const amplitude = clamp(sensationLevelDb, 0, 70) / 70;
  const wave: string[] = [`M ${COCHLEA.x0} ${COCHLEA.cy}`];
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const x = COCHLEA.x0 + t * (COCHLEA.x1 - COCHLEA.x0);
    const sigma = 0.15 * (1 + 0.6 * t);
    const g = amplitude * Math.exp(-Math.pow((t - place) / sigma, 2)) * (1 - 0.3 * t);
    wave.push(`L ${x.toFixed(1)} ${(COCHLEA.cy - g * half(t) * 1.6).toFixed(1)}`);
  }
  return wave.join(' ');
}

/** Each segment is shaded by the BONE threshold at its frequency — the hair-cell damage map,
 *  read along the tonotopic axis instead of against frequency. */
function hairCellSegments(boneConductionDb: number[]): PathNode[] {
  return boneConductionDb.map((db, i) => {
    // Index 0 is the lowest frequency, which sits at the APEX.
    const p0 = 1 - (i + 1) / SEGMENTS;
    const x = COCHLEA.x0 + p0 * (COCHLEA.x1 - COCHLEA.x0);
    const h0 = half(p0);
    const h1 = half(p0 + 1 / SEGMENTS);
    return {
      type: 'path' as const,
      d: `M ${x} ${COCHLEA.cy - h0} L ${x + SEG_W} ${COCHLEA.cy - h1} L ${x + SEG_W} ${COCHLEA.cy + h1} L ${x} ${COCHLEA.cy + h0} Z`,
      fill: 'danger',
      styleVars: { loss: clamp(db / 90, 0, 1) },
    };
  });
}

type Ctx = PresentationContext<HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint>;

export function buildHearingPresentation(ctx: Ctx): ModulePresentation<HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint> {
  const { derived } = ctx;

  // Conductive transmission: what the middle ear still passes. 60 dB of gap is a chain that has
  // stopped conducting altogether.
  const conduction = clamp(1 - derived.airBoneGapDb / 60, 0.06, 1);
  const place = placeOf(derived.stimulusFrequencyHz);
  const stimulusPlaceX = COCHLEA.x0 + place * (COCHLEA.x1 - COCHLEA.x0);

  const anatomy: FrameNode = {
    type: 'frame',
    key: 'hearing-ear',
    viewBox: [0, 0, 560, 440],
    ariaLabel:
      'The ear in cross-section: external canal, tympanic membrane, ossicular chain and oval window carrying air conduction, bone conduction bypassing them, and the cochlea unrolled along its tonotopic axis with hair-cell loss shaded at each frequency',
    defs: [{ type: 'marker', id: 'hearArrow', colorToken: 'cochlea' }],
    children: [
      // ---- Temporal bone: what bone conduction travels through ----
      { type: 'path', d: 'M 176 108 C 280 96, 420 104, 516 128', colorToken: 'text', strokeWidth: 6 },
      { type: 'text', x: 330, y: 100, text: 'Temporal bone', cls: 'anatomy', anchor: 'middle' },

      // ---- Outer ear ----
      { type: 'path', d: 'M 62 150 C 26 158, 26 226, 62 234 C 52 214, 52 172, 62 150 Z', colorToken: 'cochlea', fill: 'cochlea' },
      { type: 'text', x: 44, y: 252, text: 'Pinna', cls: 'anatomy', anchor: 'middle' },
      { type: 'path', d: 'M 62 190 L 166 190', colorToken: 'cochlea', strokeWidth: 14 },
      { type: 'text', x: 112, y: 176, text: 'Canal', cls: 'anatomy', anchor: 'middle' },

      // ---- Tympanic membrane ----
      { type: 'line', x1: 166, y1: 166, x2: 176, y2: 214, colorToken: 'text' },
      { type: 'text', x: 158, y: 230, text: 'Drum', cls: 'anatomy', anchor: 'end' },

      // ---- Ossicular chain. Fades as the conductive route fails, which is the gap. ----
      {
        type: 'group',
        styleVars: { conduction },
        children: [
          { type: 'path', d: 'M 172 182 L 198 172', colorToken: 'cochlea', strokeWidth: 2.5 },
          { type: 'circle', cx: 200, cy: 171, r: 5.5, fill: 'cochlea' },
          { type: 'path', d: 'M 204 174 L 230 180', colorToken: 'cochlea', strokeWidth: 2.5 },
          { type: 'circle', cx: 232, cy: 181, r: 5, fill: 'cochlea' },
          { type: 'path', d: 'M 236 183 L 266 188', colorToken: 'cochlea', strokeWidth: 2.5 },
          { type: 'path', d: 'M 266 178 L 266 198', colorToken: 'cochlea', strokeWidth: 2.5 },
        ],
      },
      { type: 'text', x: 214, y: 154, text: 'Malleus · incus · stapes', cls: 'anatomy', anchor: 'middle' },

      // ---- The two windows ----
      { type: 'line', x1: 272, y1: 176, x2: 272, y2: 196, colorToken: 'text' },
      { type: 'text', x: 276, y: 168, text: 'oval', cls: 'tickLabel', halo: 'bg' },
      { type: 'line', x1: 272, y1: 214, x2: 272, y2: 230, colorToken: 'text' },
      { type: 'text', x: 266, y: 240, text: 'round', cls: 'tickLabel', anchor: 'end' },

      // ---- The routes. Air goes through the chain; bone goes round it. ----
      {
        type: 'path',
        d: 'M 78 190 L 160 190',
        colorToken: 'cochlea',
        strokeWidth: 1.5 + conduction * 3.5,
        styleVars: { conduction },
        markerEnd: 'hearArrow',
      },
      { type: 'path', d: 'M 232 112 C 300 122, 344 148, 366 172', colorToken: 'text', strokeWidth: 3, markerEnd: 'hearArrow' },
      { type: 'text', x: 252, y: 132, text: 'bone conduction', cls: 'pathLabel' },

      // ---- Cochlea, unrolled, shaded by hair-cell loss at each place ----
      { type: 'path', d: ductPath(), colorToken: 'cochlea', fill: 'none', strokeWidth: 1.5 },
      ...hairCellSegments(derived.boneConductionDb),
      { type: 'path', d: travellingWavePath(derived.stimulusFrequencyHz, derived.sensationLevelDb), colorToken: 'cochlea', strokeWidth: 2 },
      { type: 'line', x1: stimulusPlaceX, y1: COCHLEA.cy - 38, x2: stimulusPlaceX, y2: COCHLEA.cy + 38, colorToken: 'text' },
      { type: 'text', x: COCHLEA.x1, y: 140, text: 'Cochlea', cls: 'anatomy', anchor: 'end' },
      { type: 'text', x: COCHLEA.x0 + 4, y: COCHLEA.cy + 50, text: 'base · 8 kHz', cls: 'tickLabel' },
      { type: 'text', x: COCHLEA.x1, y: COCHLEA.cy + 46, text: 'apex · 250 Hz', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: stimulusPlaceX, y: COCHLEA.cy - 44, text: `${derived.stimulusFrequencyHz.toFixed(0)} Hz`, cls: 'tickLabel', anchor: 'middle' },

      // ---- Auditory nerve ----
      { type: 'path', d: 'M 340 228 C 380 254, 450 262, 512 264', colorToken: 'text', strokeWidth: 3, markerEnd: 'hearArrow' },
      { type: 'text', x: 512, y: 280, text: 'Auditory nerve', cls: 'anatomy', anchor: 'end' },

      // ---- Readouts ----
      {
        type: 'text',
        x: 20,
        y: 300,
        text: `PTA ${derived.ptaDb.toFixed(0)} dB · air-bone gap ${derived.airBoneGapDb.toFixed(0)} dB`,
        cls: 'label',
      },
      { type: 'text', x: 20, y: 318, text: `Rinne ${derived.rinneResult} · Weber ${derived.weberResult}`, cls: 'caption' },
      {
        type: 'text',
        x: 20,
        y: 334,
        text: `discrimination ${derived.speechDiscriminationPct.toFixed(0)}% · recruitment ×${derived.recruitmentIndex.toFixed(2)}`,
        cls: 'caption',
      },
      {
        type: 'text',
        x: 20,
        y: 350,
        text: `stimulus ${derived.stimulusLevelDbHl.toFixed(0)} dB HL · sensation level ${derived.sensationLevelDb.toFixed(0)} dB · loudness ${derived.loudnessPct.toFixed(0)}%`,
        cls: 'caption',
      },
      ...(derived.airBoneGapDb >= CLINICAL.SIGNIFICANT_GAP_DB
        ? [{ type: 'text' as const, x: 20, y: 370, text: 'conductive gap — the chain, not the cochlea', cls: 'alarm' }]
        : []),
      { type: 'text', x: 20, y: 392, text: derived.classification, cls: 'verdict' },
      { type: 'text', x: 20, y: 412, text: derived.patternSummary, cls: 'label' },
    ],
  };

  // ---- The audiogram frame: air vs bone thresholds on a common frequency axis ----
  const audiogram: FrameNode = {
    type: 'frame',
    key: 'hearing-audiogram',
    viewBox: [0, 0, 240, 110],
    ariaLabel: `Audiogram: air conduction threshold at each of the eight test frequencies, plotted with the bone conduction threshold beneath it — the vertical distance between them is the air-bone gap`,
    children: buildAudiogramNodes(derived),
  };

  return {
    diagram: [anatomy, audiogram],
    controls: [
      { kind: 'slider', label: 'Stimulus frequency', key: 'stimulusFrequencyHz', min: 125, max: 8000, step: 5, unit: ' Hz' },
      { kind: 'slider', label: 'Stimulus level', key: 'stimulusLevelDbHl', min: -10, max: 110, step: 1, unit: ' dB HL' },
      { kind: 'slider', label: 'Outer hair cells', key: 'outerHairCellIntegrity', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Inner hair cells', key: 'innerHairCellIntegrity', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Conductive loss', key: 'conductiveLossDb', min: 0, max: 60, step: 1, unit: ' dB' },
      { kind: 'slider', label: 'Noise notch depth (4 kHz)', key: 'noiseNotchDepthDb', min: 0, max: 60, step: 1, unit: ' dB' },
      { kind: 'slider', label: 'Presbycusis severity', key: 'presbycusisSeverity', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Ménière low-frequency loss', key: 'meniereLowFreqLossDb', min: 0, max: 60, step: 1, unit: ' dB' },
    ],
    readouts: [
      {
        label: 'PTA',
        value: (c) => c.derived.ptaDb.toFixed(0),
        unit: 'dB HL',
        secondary: (c) =>
          c.derived.ptaDb < 16 ? 'normal' : c.derived.ptaDb < 41 ? 'mild' : c.derived.ptaDb < 71 ? 'moderate' : 'severe',
        colorToken: 'cochlea',
      },
      {
        label: 'Air-bone gap',
        value: (c) => c.derived.airBoneGapDb.toFixed(0),
        unit: 'dB',
        secondary: (c) => (c.derived.airBoneGapDb >= CLINICAL.SIGNIFICANT_GAP_DB ? 'middle ear blocking' : 'no gap'),
        colorToken: 'cochlea',
      },
      {
        label: 'Speech discrimination',
        value: (c) => c.derived.speechDiscriminationPct.toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.speechDiscriminationPct >= CLINICAL.NORMAL_DISCRIMINATION_PCT
            ? 'words clear if audible'
            : 'distortion — transducer failing',
        colorToken: 'ok',
      },
      {
        label: 'Recruitment',
        value: (c) => `×${c.derived.recruitmentIndex.toFixed(2)}`,
        secondary: (c) => (c.derived.recruitmentIndex > 1.3 ? 'loudness grows abnormally fast' : 'normal compression'),
        colorToken: 'danger',
      },
      {
        label: 'Loudness',
        value: (c) => c.derived.loudnessPct.toFixed(0),
        unit: '%',
        secondary: (c) => `${c.derived.sensationLevelDb.toFixed(0)} dB above threshold`,
        colorToken: 'warn',
      },
      {
        label: 'Rinne',
        value: (c) => (c.derived.rinneResult.startsWith('negative') ? 'negative' : 'positive'),
        secondary: (c) => c.derived.rinneResult,
        colorToken: 'text',
      },
      {
        label: 'Weber',
        value: (c) => c.derived.weberResult,
        secondary: (c) =>
          c.derived.weberCode === 1 ? 'toward = conductive' : c.derived.weberCode === -1 ? 'away = sensorineural' : 'central',
        colorToken: 'text',
      },
      {
        label: 'Stapedius reflex',
        value: (c) => (c.derived.stapediusActive ? 'contracted' : 'relaxed'),
        secondary: () => 'engages above ~85 dB HL',
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
      { kind: 'sparkline', label: 'Pure-tone average', unit: 'dB', colorToken: 'cochlea', domainMin: 0, domainMax: 80, data: (points) => points.map((p) => p.pta) },
      { kind: 'sparkline', label: 'Loudness', unit: '%', colorToken: 'warn', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.loudness) },
      { kind: 'sparkline', label: 'Temporary threshold shift', unit: 'dB', colorToken: 'danger', domainMin: 0, domainMax: 30, data: (points) => points.map((p) => p.tts) },
    ],
  };
}

/* --- The audiogram plot ------------ */

/** Audiogram plot dimensions, mirroring Audiogram.tsx. */
const AG = { w: 220, h: 84, maxDb: 90, padL: 4 };

/** Horizontal position of frequency index i. */
const agX = (i: number) => AG.padL + (i / (AUDIOGRAM_FREQS_HZ.length - 1)) * (AG.w - AG.padL * 2);
/** Vertical position of a threshold in dB (larger dB is lower on the page). */
const agY = (db: number) => (clamp(db, 0, AG.maxDb) / AG.maxDb) * AG.h;

/** Build a polyline path from an array of thresholds. */
function thresholdLine(values: number[]): string {
  return values
    .map((db, i) => `${i === 0 ? 'M' : 'L'}${agX(i).toFixed(1)},${agY(db).toFixed(1)}`)
    .join(' ');
}

/** The audiogram: air above bone is a gap, and the gap is the conductive component. */
function buildAudiogramNodes(derived: HearingDerived): SceneNode[] {
  const nodes: SceneNode[] = [];

  // Horizontal gridlines at 20/40/60/80 dB.
  for (const db of [20, 40, 60, 80]) {
    nodes.push({ type: 'line', x1: 0, x2: AG.w, y1: agY(db), y2: agY(db), colorToken: 'text' });
  }

  // Bone conduction (dashed) and air conduction (solid) lines on the same axis.
  nodes.push({ type: 'path', d: thresholdLine(derived.boneConductionDb), colorToken: 'text', strokeWidth: 1.5 });
  nodes.push({ type: 'path', d: thresholdLine(derived.airConductionDb), colorToken: 'cochlea', strokeWidth: 1.75 });

  // Air-conduction measurement marks at each frequency.
  derived.airConductionDb.forEach((db, i) => {
    nodes.push({ type: 'circle', cx: agX(i), cy: agY(db), r: 2.4, fill: 'cochlea' });
  });

  nodes.push({
    type: 'text',
    x: 8,
    y: 100,
    text: `Audiogram · gap ${derived.airBoneGapDb.toFixed(0)} dB`,
    cls: 'pathLabel',
  });

  return nodes;
}
