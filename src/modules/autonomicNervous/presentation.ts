import { clamp, scaleClamped } from '@/shared/lib/math';
import { BRONCHI, GI, HEART, PUPIL, SECRETION } from './engine/constants';
import type { AnsDerived, AnsHistoryPoint, AnsInputs, AnsState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const HEART_PATH = 'M0,-12 C-8,-22 -24,-18 -24,-4 C-24,10 -8,20 0,26 C8,20 24,10 24,-4 C24,-18 8,-22 0,-12 Z';
const LUNG_PATH = 'M0,-20 C10,-21 16,-7 15,7 C14,20 7,26 0,26 C-7,26 -14,20 -15,7 C-16,-7 -10,-21 0,-20 Z';
const GLAND_PATH = 'M-11,-8 C-11,-16 -1,-19 7,-14 C15,-9 14,2 6,8 C-2,14 -12,9 -11,-1 Z';
const SMALL_INTESTINE_PATH =
  'M-40,-10 C-30,-24 -10,-24 0,-10 C10,4 30,4 40,-10 C46,-2 46,10 38,16 C26,24 14,10 0,16 C-14,22 -26,8 -38,16 C-46,10 -46,-2 -40,-10 Z';
const MESSENGER_BAR_WIDTH = 76;
// A circle centred on (0,4) — the pupil's iris, stroked rather than filled.
const IRIS_PATH = 'M0,4 m-17,0 a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0';
// A rounded track (rx 3.5) for the second-messenger bars, stroked rather than filled.
const BAR_TRACK_PATH = 'M3.5,0 H72.5 A3.5,3.5 0 0 1 76,3.5 A3.5,3.5 0 0 1 72.5,7 H3.5 A3.5,3.5 0 0 1 0,3.5 A3.5,3.5 0 0 1 3.5,0 Z';

type Ctx = PresentationContext<AnsState, AnsDerived, AnsInputs, AnsHistoryPoint>;

export function buildAutonomicNervousPresentation(ctx: Ctx): ModulePresentation<AnsState, AnsDerived, AnsInputs, AnsHistoryPoint> {
  const { derived } = ctx;

  // Each organ's tint reflects which branch is currently winning AT that organ — which is how
  // the heart and the gut end up tinted oppositely under the same autonomic state.
  const heartDrive = scaleClamped(derived.heartRateBpm, 50, HEART.MAX_BPM, 0, 1);
  const giDrive = scaleClamped(derived.giMotilityIndex, GI.MIN_INDEX, GI.MAX_INDEX, 0, 1);
  const bronchialDrive = scaleClamped(derived.bronchialDiameterPercent, BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT, 0, 1);
  const secretionDrive = scaleClamped(derived.secretionIndex, SECRETION.MIN_INDEX, SECRETION.MAX_INDEX, 0, 1);
  const pupilRadius = scaleClamped(derived.pupilDiameterMm, PUPIL.MIN_MM, PUPIL.MAX_MM, 3, 13);
  const pupilIntensity = scaleClamped(derived.pupilDiameterMm, PUPIL.MIN_MM, PUPIL.MAX_MM, 0, 1);

  const heartTint = derived.heartRateBpm >= 70 ? 'sympathetic' : 'parasympathetic';
  const bronchialTint = derived.bronchialDiameterPercent >= BRONCHI.BASELINE_PERCENT ? 'sympathetic' : 'parasympathetic';
  const giTint = derived.giMotilityIndex >= GI.BASELINE_INDEX ? 'parasympathetic' : 'sympathetic';
  const secretionTint = derived.secretionIndex >= SECRETION.BASELINE_INDEX ? 'parasympathetic' : 'sympathetic';

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Diagram of autonomic control across five organ effectors — heart, bronchi, pupil, gut and glands — each tinted by whether sympathetic or parasympathetic activity currently dominates it, alongside the cAMP and IP3 second-messenger levels',
        children: [
          // The central neuraxis the two branches run down.
          { type: 'line', x1: 240, y1: 36, x2: 240, y2: 270, colorToken: 'text-faint' },
          { type: 'text', x: 16, y: 22, text: 'Sympathetic', cls: 'pathLabel', colorToken: 'sympathetic' },
          { type: 'text', x: 378, y: 22, text: 'Parasympathetic', cls: 'pathLabel', colorToken: 'parasympathetic' },

          {
            type: 'group',
            transform: 'translate(92,92)',
            styleVars: { 'organ-drive': clamp(heartDrive, 0, 1), 'hr-bpm': derived.heartRateBpm },
            children: [
              { type: 'path', d: HEART_PATH, fill: heartTint, colorToken: heartTint, strokeWidth: 2 },
              { type: 'text', x: 0, y: 42, text: 'Heart', cls: 'organLabel' },
              { type: 'text', x: 0, y: 55, text: `${derived.heartRateBpm.toFixed(0)} bpm`, cls: 'valueLabel', anchor: 'middle' },
            ],
          },

          {
            type: 'group',
            transform: 'translate(224,92)',
            styleVars: { 'organ-drive': clamp(bronchialDrive, 0, 1) },
            children: [
              { type: 'group', transform: 'translate(-13,0)', children: [{ type: 'path', d: LUNG_PATH, fill: bronchialTint, colorToken: bronchialTint, strokeWidth: 2 }] },
              { type: 'group', transform: 'translate(13,0) scale(-1,1)', children: [{ type: 'path', d: LUNG_PATH, fill: bronchialTint, colorToken: bronchialTint, strokeWidth: 2 }] },
              { type: 'text', x: 0, y: 42, text: 'Bronchi', cls: 'organLabel' },
              { type: 'text', x: 0, y: 55, text: `${derived.bronchialDiameterPercent.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle' },
            ],
          },

          {
            type: 'group',
            transform: 'translate(356,92)',
            styleVars: { 'organ-drive': clamp(pupilIntensity, 0, 1) },
            children: [
              { type: 'path', d: IRIS_PATH, colorToken: 'sympathetic', fill: 'none', strokeWidth: 2 },
              { type: 'circle', cx: 0, cy: 4, r: pupilRadius, fill: 'bg' },
              { type: 'text', x: 0, y: 42, text: 'Pupil', cls: 'organLabel' },
              { type: 'text', x: 0, y: 55, text: `${derived.pupilDiameterMm.toFixed(1)} mm`, cls: 'valueLabel', anchor: 'middle' },
            ],
          },

          // Gut motility (sympathetic INHIBITS, muscarinic STIMULATES — opposite sign to the heart).
          {
            type: 'group',
            transform: 'translate(140,212)',
            styleVars: { 'organ-drive': clamp(giDrive, 0, 1) },
            children: [
              {
                type: 'group',
                transform: 'scale(0.72)',
                children: [{ type: 'path', d: SMALL_INTESTINE_PATH, fill: giTint, colorToken: giTint, strokeWidth: 2 }],
              },
              { type: 'text', x: 0, y: 42, text: 'Gut motility', cls: 'organLabel' },
              { type: 'text', x: 0, y: 55, text: derived.giMotilityIndex.toFixed(0), cls: 'valueLabel', anchor: 'middle' },
            ],
          },

          {
            type: 'group',
            transform: 'translate(308,212)',
            styleVars: { 'organ-drive': clamp(secretionDrive, 0, 1) },
            children: [
              { type: 'path', d: GLAND_PATH, fill: secretionTint, colorToken: secretionTint, strokeWidth: 2 },
              { type: 'text', x: 0, y: 42, text: 'Secretions', cls: 'organLabel' },
              { type: 'text', x: 0, y: 55, text: derived.secretionIndex.toFixed(0), cls: 'valueLabel', anchor: 'middle' },
            ],
          },

          // Second-messenger cascade indicators.
          {
            type: 'group',
            transform: 'translate(40,278)',
            children: [
              { type: 'text', x: 0, y: -6, text: 'cAMP (Gs / beta)', cls: 'pathLabel' },
              { type: 'path', d: BAR_TRACK_PATH, colorToken: 'second-messenger', fill: 'none', strokeWidth: 1 },
              { type: 'rect', x: 0, y: 0, width: MESSENGER_BAR_WIDTH * clamp(derived.campLevel, 0, 1), height: 7, fill: 'second-messenger' },
            ],
          },
          {
            type: 'group',
            transform: 'translate(330,278)',
            children: [
              { type: 'text', x: 0, y: -6, text: 'IP3 / Ca (Gq)', cls: 'pathLabel' },
              { type: 'path', d: BAR_TRACK_PATH, colorToken: 'second-messenger', fill: 'none', strokeWidth: 1 },
              { type: 'rect', x: 0, y: 0, width: MESSENGER_BAR_WIDTH * clamp(derived.ip3CalciumLevel, 0, 1), height: 7, fill: 'second-messenger' },
            ],
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Sympathetic tone', key: 'sympatheticTone', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Parasympathetic tone', key: 'parasympatheticTone', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Circulating epinephrine', key: 'circulatingEpinephrine', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Beta blockade', key: 'betaBlockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Muscarinic blockade', key: 'muscarinicBlockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Alpha-1 blockade', key: 'alphaBlockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Cholinesterase inhibition', key: 'cholinesteraseInhibition', min: 0, max: 100, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'Autonomic balance',
        value: (c) => c.derived.autonomicBalance.toFixed(2),
        secondary: (c) => {
          const b = c.derived.autonomicBalance;
          if (b > 0.25) return 'sympathetic dominant';
          if (b < -0.25) return 'parasympathetic dominant';
          return 'balanced';
        },
        colorToken: 'sympathetic',
      },
      { label: 'Heart rate', value: (c) => c.derived.heartRateBpm.toFixed(0), unit: 'bpm', colorToken: 'sympathetic' },
      { label: 'Gut motility', value: (c) => c.derived.giMotilityIndex.toFixed(0), colorToken: 'parasympathetic' },
      { label: 'Pupil', value: (c) => c.derived.pupilDiameterMm.toFixed(1), unit: 'mm', colorToken: 'sympathetic' },
      { label: 'Bronchial calibre', value: (c) => c.derived.bronchialDiameterPercent.toFixed(0), unit: '%', colorToken: 'parasympathetic' },
      { label: 'Secretions', value: (c) => c.derived.secretionIndex.toFixed(0), colorToken: 'parasympathetic' },
      { label: 'Alpha-1', value: (c) => (c.derived.alpha1Activation * 100).toFixed(0), unit: '%', colorToken: 'sympathetic' },
      { label: 'Beta-1', value: (c) => (c.derived.beta1Activation * 100).toFixed(0), unit: '%', colorToken: 'sympathetic' },
      { label: 'Beta-2', value: (c) => (c.derived.beta2Activation * 100).toFixed(0), unit: '%', colorToken: 'sympathetic' },
      { label: 'Muscarinic', value: (c) => (c.derived.muscarinicActivation * 100).toFixed(0), unit: '%', colorToken: 'parasympathetic' },
    ],
    charts: [
      { kind: 'sparkline', label: 'Heart rate', unit: 'bpm', colorToken: 'sympathetic', domainMin: 30, domainMax: 200, data: (points) => points.map((p) => p.heartRate) },
      { kind: 'sparkline', label: 'Gut motility', colorToken: 'parasympathetic', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.giMotility) },
      { kind: 'sparkline', label: 'Pupil', unit: 'mm', colorToken: 'sympathetic', domainMin: 1, domainMax: 9, data: (points) => points.map((p) => p.pupilDiameter) },
    ],
  };
}
