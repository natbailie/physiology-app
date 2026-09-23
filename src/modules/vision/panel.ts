import type { PanelField } from '@/shared/assessment/types';
import type { VisionDerived, VisionInternalState } from './engine/types';

export type VisionSnapshot = { state: VisionInternalState; derived: VisionDerived };

// A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
// the engine, so a case file importing these panels from THERE would drag the whole vision
// engine into the ward-round index that loads on the home page. Consumers read them here
// instead, which also means the rows a learner is examined on are the rows the bedside shows
// them — one definition, not two that agree until somebody edits one.

/**
 * The pupil and reflex panel: acuity, both pupils, anisocoria, perceived brightness and the
 * swinging-torch summary. Between them these separate a retinal failure (pupils normal, wrong
 * illumination) from an afferent one (torch moves nothing) from an efferent one (torch moves
 * the other eye) — and no one of them does it alone.
 */
export const PUPIL_PANEL: readonly PanelField<VisionSnapshot>[] = [
  { label: 'Acuity', unit: '/6', value: (s) => s.derived.acuityDenominator, decimals: 0 },
  { label: 'Right pupil', unit: 'mm', value: (s) => s.derived.pupilRightMm, decimals: 1 },
  { label: 'Left pupil', unit: 'mm', value: (s) => s.derived.pupilLeftMm, decimals: 1 },
  { label: 'Anisocoria', unit: 'mm', value: (s) => s.derived.anisocoriaMm, decimals: 1 },
  { label: 'Perceived brightness', unit: '%', value: (s) => s.derived.perceivedBrightness, decimals: 0 },
  {
    label: 'Swinging torch',
    value: (s) => Math.min(s.derived.directReflexRightScore, s.derived.directReflexLeftScore),
    decimals: 0,
    tolerance: 0.25,
  },
];

/**
 * The pressure panel: intraocular pressure, angle closure fraction, pupil, anisocoria and
 * acuity. The same end organ at two utterly different tempos — crisis within hours against
 * silent theft over decades — which is why both glaucomas share these rows.
 */
export const PRESSURE_PANEL: readonly PanelField<VisionSnapshot>[] = [
  {
    label: 'Intraocular pressure',
    unit: 'mmHg',
    value: (s) => s.derived.intraocularPressureMmHg,
    decimals: 0,
    tolerance: 0.08,
  },
  {
    label: 'Angle closed',
    unit: '%',
    value: (s) => s.derived.angleClosureFraction * 100,
    decimals: 0,
    tolerance: 0.12,
  },
  { label: 'Right pupil', unit: 'mm', value: (s) => s.derived.pupilRightMm, decimals: 1, tolerance: 0.08 },
  { label: 'Anisocoria', unit: 'mm', value: (s) => s.derived.anisocoriaMm, decimals: 1, tolerance: 0.2 },
  { label: 'Acuity', unit: '/6', value: (s) => s.derived.acuityDenominator, decimals: 0 },
];

/**
 * The field panel: five sectors across both eyes, in percent of normal sensitivity. Field
 * loss names the lesion site — chiasm takes both temporal fields, Meyer loop takes a
 * contralateral upper quadrant, occipital cortex takes a whole side and spares the macula.
 */
export const FIELD_PANEL: readonly PanelField<VisionSnapshot>[] = [
  {
    label: 'R superior temporal',
    value: (s) => s.derived.fieldSectors.rightEye.superiorTemporal * 100,
    decimals: 0,
    tolerance: 0.05,
  },
  {
    label: 'R inferior nasal',
    value: (s) => s.derived.fieldSectors.rightEye.inferiorNasal * 100,
    decimals: 0,
    tolerance: 0.05,
  },
  {
    label: 'L superior temporal',
    value: (s) => s.derived.fieldSectors.leftEye.superiorTemporal * 100,
    decimals: 0,
    tolerance: 0.05,
  },
  {
    label: 'L superior nasal',
    value: (s) => s.derived.fieldSectors.leftEye.superiorNasal * 100,
    decimals: 0,
    tolerance: 0.05,
  },
  {
    label: 'L inferior nasal',
    value: (s) => s.derived.fieldSectors.leftEye.inferiorNasal * 100,
    decimals: 0,
    tolerance: 0.05,
  },
];
