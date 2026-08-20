import type { HpgInputs } from './types';

export const DEFAULT_HPG_INPUTS: HpgInputs = {
  sex: 'female',
  gnrhPulseFrequency: 1,
  hypothalamicSuppression: 0,
  gonadalFunction: 1,
  exogenousTestosterone: 0,
  exogenousEstrogenProgesterone: 0,
};

export type HpgPresetName =
  | 'normalFemaleCycle'
  | 'normalMaleAxis'
  | 'primaryHypogonadism'
  | 'hypothalamicAmenorrhea'
  | 'anabolicSteroidUse'
  | 'combinedOCP';

export const HPG_PRESETS: Record<HpgPresetName, Partial<HpgInputs>> = {
  // Leave this running and the LH surge will fire on its own once follicular estrogen has
  // been high for long enough — the surge is emergent, not scheduled.
  normalFemaleCycle: { ...DEFAULT_HPG_INPUTS },
  normalMaleAxis: { ...DEFAULT_HPG_INPUTS, sex: 'male' },
  // Gonadal failure: no steroid feedback, so LH and FSH both climb unchecked. Loss of inhibin
  // lifts FSH disproportionately — the classic hypergonadotropic picture.
  primaryHypogonadism: { ...DEFAULT_HPG_INPUTS, sex: 'male', gonadalFunction: 0.05 },
  // Stress or low energy availability suppresses GnRH: estrogen never rises far enough for
  // long enough, so the surge never fires and ovulation does not occur.
  hypothalamicAmenorrhea: { ...DEFAULT_HPG_INPUTS, hypothalamicSuppression: 85, gnrhPulseFrequency: 0.2 },
  // High total testosterone from an exogenous source suppresses LH/FSH, shutting down
  // endogenous production — which is why it causes testicular atrophy and infertility.
  anabolicSteroidUse: { ...DEFAULT_HPG_INPUTS, sex: 'male', exogenousTestosterone: 150 },
  // Sustained exogenous steroid keeps LH/FSH suppressed, so no dominant follicle matures and
  // the surge never fires — contraception by preventing ovulation, not by blocking the ovary.
  combinedOCP: { ...DEFAULT_HPG_INPUTS, exogenousEstrogenProgesterone: 120 },
};

export const HPG_PRESET_LABELS: Record<HpgPresetName, string> = {
  normalFemaleCycle: 'Normal female cycle',
  normalMaleAxis: 'Normal male axis',
  primaryHypogonadism: 'Primary hypogonadism',
  hypothalamicAmenorrhea: 'Hypothalamic amenorrhea',
  anabolicSteroidUse: 'Anabolic steroid use',
  combinedOCP: 'Combined OCP',
};

export const PRESET_ORDER: HpgPresetName[] = [
  'normalFemaleCycle',
  'normalMaleAxis',
  'primaryHypogonadism',
  'hypothalamicAmenorrhea',
  'anabolicSteroidUse',
  'combinedOCP',
];
