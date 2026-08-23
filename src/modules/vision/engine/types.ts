export type VisionState_Classification =
  | 'scotopic'
  | 'mesopic'
  | 'photopic'
  | 'night blindness (rod failure)'
  | 'macular cone failure'
  | 'left RAPD (afferent defect)'
  | 'efferent defect: fixed dilated pupil';

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
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  rodIntegrity: number;
  coneIntegrity: number;
  leftOpticNerveAfferent: number;
  rightPupilEfferentGain: number;
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
}
