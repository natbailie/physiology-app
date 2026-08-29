export type VisionState_Classification =
  | 'scotopic'
  | 'mesopic'
  | 'photopic'
  | 'night blindness (rod failure)'
  | 'macular cone failure'
  | 'left RAPD (afferent defect)'
  | 'efferent defect: fixed dilated pupil'
  | 'acute angle closure'
  | 'chronic glaucoma (open angle)'
  | 'presbyopic blur';

import type { EyeFieldSectors } from './visualFields';
import type { FieldLesionSite } from './visualFields';

export type { FieldLesionSite, EyeFieldSectors } from './visualFields';

export interface VisionInputs {
  /** Scene luminance, log10 cd/m2 (-5 starlight to +4 bright sunlight). */
  sceneLuminanceLogCd: number;
  /** Rod system integrity, fraction (0-1). Low models retinitis pigmentosa. */
  rodIntegrity: number;
  /** Foveal cone integrity, fraction (0-1). Low models macular degeneration. */
  coneIntegrity: number;
  /** Left optic nerve afferent conduction, fraction of normal (0-1). Low models optic neuritis. */
  leftOpticNerveAfferent: number;
  /** Right pupil efferent (parasympathetic) gain, fraction (0-1). Low models a fixed dilated
   * pupil — third-nerve palsy, anticholinergic, Adie's tonic pupil. */
  rightPupilEfferentGain: number;
  /** Fixation distance, metres (0.12-6). Sets the accommodative and convergence demand. */
  targetDistanceMetres: number;
  /** Lens amplitude, dioptres (0-12). Falls with age — the story of presbyopia. */
  maximumAccommodationD: number;
  /** Aqueous production, multiple of normal (0-2). */
  aqueousProductionRate: number;
  /** Trabecular outflow facility, fraction of normal (0-1.5). Low models open-angle glaucoma. */
  trabecularOutflowFacility: number;
  /** Anterior chamber angle width, percent (0 occludable to 100 wide open). */
  angleWidthPct: number;
  /** Pilocarpine dose, percent of standard effect (0-100): opens the meshwork and the angle. */
  pilocarpineDosePct: number;
  /** Acetazolamide dose, percent of standard effect (0-100): slows the ciliary pump. */
  acetazolamideDosePct: number;
  /** Mydriatic/antimuscarinic dose, percent of standard effect (0-100): dilates the pupil and
   * provokes closure in an occludable angle. */
  mydriaticDosePct: number;
  /** Site of any lesion along the visual pathway. */
  fieldLesionSite: FieldLesionSite;
}

/** Which eye the torch is shining in, as a signed marker: 0 none, 1 right, -1 left. */
export type FlashEye = 0 | 1 | -1;

export interface VisionInternalState {
  simTimeSeconds: number;
  /** Persistent offset added to the input scene luminance, log units — how "lights out"
   * and "bright glare" actions are applied without overwriting the slider. */
  luminanceShiftLog: number;
  /** Fraction of rod pigment bleached by a recent glare. Regenerates slowly. */
  bleachedFraction: number;
  /** Log-luminance each receptor class has shifted its operating range to. Rod adaptation
   * cannot climb past its saturation ceiling; cones cannot follow into deep darkness. */
  rodAdaptedLogCd: number;
  coneAdaptedLogCd: number;
  pupilRightMm: number;
  pupilLeftMm: number;
  flashEye: FlashEye;
  /** Intraocular pressure, mmHg — relaxes toward what production vs drainage implies. */
  intraocularPressureMmHg: number;
  /** Appositional closure of the anterior chamber angle, fraction (0-1). */
  angleClosureFraction: number;
  /** Dioptres of accommodation actually delivered. */
  accommodativeResponseD: number;
}

export interface VisionDerived {
  effectiveLuminanceLogCd: number;
  regime: 'scotopic' | 'mesopic' | 'photopic';
  /** Naka-Rushton responses of each class at the current scene, after adaptation. */
  rodResponse: number;
  coneResponse: number;
  /** Weighted contribution of each class to the overall signal — the mesopic balance. */
  rodDrive: number;
  coneDrive: number;
  /** Photoreceptors HYPERpolarise to light and release LESS glutamate; it is the fall that
   * the ON-bipolar cell reads as "light". Near 1 in darkness, near 0 in bright light. */
  glutamateRelease: number;
  perceivedBrightness: number;
  pupilRightMm: number;
  pupilLeftMm: number;
  anisocoriaMm: number;
  rapdPositive: boolean;
  /** Constriction magnitude (0-100) each eye produces when the torch shines in it —
   * the numbers the swinging-torch test compares. */
  directReflexRightScore: number;
  directReflexLeftScore: number;
  acuityDenominator: number;
  acuityLabel: string;
  nightBlindness: boolean;
  classification: VisionState_Classification;
  patternSummary: string;

  // Aqueous circulation and pressure.
  intraocularPressureMmHg: number;
  angleClosureFraction: number;
  aqueousProductionUlPerMin: number;
  outflowFacilityUlPerMinPerMmhg: number;

  // Accommodation and the near triad.
  accommodationDemandD: number;
  accommodativeResponseD: number;
  accommodationDeficitD: number;
  blurActive: boolean;
  nearPointCm: number;
  convergenceDemandPrismD: number;

  // Visual pathways.
  fieldSectors: { rightEye: EyeFieldSectors; leftEye: EyeFieldSectors };
  fieldDefectLabel: string;
  maculaSpared: boolean;

  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  rodIntegrity: number;
  coneIntegrity: number;
  leftOpticNerveAfferent: number;
  rightPupilEfferentGain: number;
  /** Where along the pathway the lesion sits. Passed through so the diagram can mark the site
   * rather than inferring it from the name of the resulting field defect. */
  fieldLesionSite: FieldLesionSite;
}

export interface VisionSnapshot {
  state: VisionInternalState;
  derived: VisionDerived;
}

export interface VisionHistoryPoint {
  t: number;
  brightness: number;
  pupilR: number;
  pupilL: number;
  bleached: number;
  iop: number;
}
