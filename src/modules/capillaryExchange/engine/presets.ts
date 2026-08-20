import { TISSUE_BEDS } from './constants';
import type { CapillaryInputs, TissueBed } from './types';

export const DEFAULT_CAPILLARY_INPUTS: CapillaryInputs = {
  arterialInflowPressure: 95,
  venousOutflowPressure: 12,
  precapillaryTone: 1,
  plasmaAlbuminGDl: 4.2,
  capillaryPermeability: 1,
  reflectionCoefficient: 1,
  lymphaticFlowCapacity: 1,
  interstitialCompliance: 1,
  tissueBed: 'systemic',
};

/** Selecting a tissue bed also loads that bed's characteristic pressures and reflection
 * coefficient, since those are properties of the vessel wall rather than free choices. The
 * sliders remain live afterwards, so "what if the lung had liver-like capillaries?" is still
 * an experiment the user can run. */
export function bedDefaults(tissueBed: TissueBed): Partial<CapillaryInputs> {
  const bed = TISSUE_BEDS[tissueBed];
  return {
    tissueBed,
    arterialInflowPressure: bed.defaultInflowPressure,
    venousOutflowPressure: bed.defaultOutflowPressure,
    reflectionCoefficient: bed.defaultReflectionCoefficient,
  };
}

export type CapillaryPresetName =
  | 'normal'
  | 'heartFailure'
  | 'nephrotic'
  | 'liverFailure'
  | 'sepsis'
  | 'lymphoedema'
  | 'pulmonaryOedema'
  | 'dependentOedema'
  | 'glomerularFiltration';

export const CAPILLARY_PRESETS: Record<CapillaryPresetName, Partial<CapillaryInputs>> = {
  normal: { ...DEFAULT_CAPILLARY_INPUTS },
  // Raised venous pressure, transmitted almost completely back to the capillary because
  // postcapillary resistance is so much smaller than precapillary resistance.
  heartFailure: { ...DEFAULT_CAPILLARY_INPUTS, venousOutflowPressure: 34 },
  // Albumin lost in the urine. Note how non-linear the effect is: halving albumin does far
  // more than halve the oncotic pressure holding fluid in.
  nephrotic: { ...DEFAULT_CAPILLARY_INPUTS, plasmaAlbuminGDl: 1.6 },
  // Two hits at once — impaired albumin synthesis AND portal hypertension — in a bed whose
  // sinusoids barely reflect protein at all, so the oncotic term can hardly resist anything.
  liverFailure: { ...bedDefaults('hepatic'), plasmaAlbuminGDl: 2.2, arterialInflowPressure: 34 },
  // The leaky-capillary case. Sigma collapses, so the oncotic gradient stops working, and
  // albumin infusion follows the fluid straight into the tissues instead of pulling it back.
  sepsis: { ...DEFAULT_CAPILLARY_INPUTS, reflectionCoefficient: 0.45, capillaryPermeability: 2 },
  // Every Starling force normal; only the drainage has failed. The interstitial protein is
  // what accumulates first, and it is what makes this oedema non-pitting and eventually fibrotic.
  lymphoedema: { ...DEFAULT_CAPILLARY_INPUTS, lymphaticFlowCapacity: 0.03 },
  // Raised left atrial pressure in a bed with only a tenfold lymphatic reserve and almost no
  // tolerance for extra fluid.
  pulmonaryOedema: { ...bedDefaults('pulmonary'), venousOutflowPressure: 32 },
  // Gravity at the ankle. Standing adds tens of mmHg to venous pressure, which is why the
  // healthy safety factors are needed at all.
  dependentOedema: { ...DEFAULT_CAPILLARY_INPUTS, venousOutflowPressure: 26 },
  // The same equation with the numbers rearranged: sigma 1, protein-free filtrate, a high
  // capillary pressure held by the efferent arteriole, and an enormous Kf. This is GFR.
  glomerularFiltration: { ...bedDefaults('glomerulus') },
};

export const CAPILLARY_PRESET_LABELS: Record<CapillaryPresetName, string> = {
  normal: 'Normal',
  heartFailure: 'Heart failure',
  nephrotic: 'Nephrotic syndrome',
  liverFailure: 'Liver failure',
  sepsis: 'Sepsis / burns',
  lymphoedema: 'Lymphoedema',
  pulmonaryOedema: 'Pulmonary oedema',
  dependentOedema: 'Standing all day',
  glomerularFiltration: 'Glomerulus',
};

export const CAPILLARY_PRESET_ORDER: CapillaryPresetName[] = [
  'normal',
  'heartFailure',
  'dependentOedema',
  'nephrotic',
  'liverFailure',
  'sepsis',
  'lymphoedema',
  'pulmonaryOedema',
  'glomerularFiltration',
];
