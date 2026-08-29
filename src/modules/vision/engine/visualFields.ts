/**
 * The visual pathways, mapped as a fixed geometry: each hemiretina's fibres run to a known
 * destination, so a lesion's site determines the field defect rather than suggesting it.
 * Sectors are named by VISUAL FIELD position — what the patient misses — because that is the
 * convention the defects are named in.
 *
 *   temporal field of an eye  ← nasal retina   → crosses at the chiasm
 *   nasal field of an eye     ← temporal retina → stays ipsilateral
 *
 * A left optic tract therefore carries the RIGHT visual field of both eyes, and so on back
 * through the radiations (temporal lobe = superior quadrant, parietal = inferior) to the
 * cortex, where the occipital pole's dual supply spares central vision.
 */

export type FieldLesionSite =
  | 'none'
  | 'leftOpticNerve'
  | 'rightOpticNerve'
  | 'chiasmalCentre'
  | 'leftOpticTract'
  | 'rightOpticTract'
  | 'leftTemporalRadiation'
  | 'rightTemporalRadiation'
  | 'leftParietalRadiation'
  | 'rightParietalRadiation'
  | 'leftOccipitalLobe'
  | 'rightOccipitalLobe';

export interface EyeFieldSectors {
  /** Superior temporal visual-field quadrant integrity, 0-1. */
  superiorTemporal: number;
  superiorNasal: number;
  inferiorTemporal: number;
  inferiorNasal: number;
}

export interface FieldMapping {
  rightEye: EyeFieldSectors;
  leftEye: EyeFieldSectors;
  label: string;
  maculaSpared: boolean;
}

const INTACT: EyeFieldSectors = { superiorTemporal: 1, superiorNasal: 1, inferiorTemporal: 1, inferiorNasal: 1 };
const BLIND: EyeFieldSectors = { superiorTemporal: 0, superiorNasal: 0, inferiorTemporal: 0, inferiorNasal: 0 };

function sectors(patches: Partial<EyeFieldSectors>[]): EyeFieldSectors {
  const merged = { ...INTACT };
  for (const patch of patches) Object.assign(merged, patch);
  return merged;
}

/** The macular fibres at the occipital pole enjoy a dual arterial supply, which is why a
 * posterior cerebral infarct blinds the field but spares fixation. */
const MACULA_SPARING_RESIDUE = 0;

export function mapFieldLesion(site: FieldLesionSite): FieldMapping {
  switch (site) {
    case 'none':
      return { rightEye: { ...INTACT }, leftEye: { ...INTACT }, label: 'no field defect', maculaSpared: false };
    case 'leftOpticNerve':
      return {
        rightEye: { ...INTACT },
        leftEye: { ...BLIND },
        label: 'left monocular vision loss',
        maculaSpared: false,
      };
    case 'rightOpticNerve':
      return {
        rightEye: { ...BLIND },
        leftEye: { ...INTACT },
        label: 'right monocular vision loss',
        maculaSpared: false,
      };
    case 'chiasmalCentre':
      // Fibres from both nasal retinas cross here — the temporal fields of both eyes.
      return {
        rightEye: sectors([{ superiorTemporal: 0, inferiorTemporal: 0 }]),
        leftEye: sectors([{ superiorTemporal: 0, inferiorTemporal: 0 }]),
        label: 'bitemporal hemianopia',
        maculaSpared: false,
      };
    case 'leftOpticTract':
      // The left tract carries the RIGHT visual field of both eyes.
      return {
        rightEye: sectors([{ superiorTemporal: 0, inferiorTemporal: 0 }]),
        leftEye: sectors([{ superiorNasal: 0, inferiorNasal: 0 }]),
        label: 'right homonymous hemianopia',
        maculaSpared: false,
      };
    case 'rightOpticTract':
      return {
        rightEye: sectors([{ superiorNasal: 0, inferiorNasal: 0 }]),
        leftEye: sectors([{ superiorTemporal: 0, inferiorTemporal: 0 }]),
        label: 'left homonymous hemianopia',
        maculaSpared: false,
      };
    case 'leftTemporalRadiation':
      // Meyer's loop sweeps through the temporal lobe carrying the contralateral SUPERIOR field.
      return {
        rightEye: sectors([{ superiorTemporal: 0 }]),
        leftEye: sectors([{ superiorNasal: 0 }]),
        label: 'right superior quadrantanopia',
        maculaSpared: false,
      };
    case 'rightTemporalRadiation':
      return {
        rightEye: sectors([{ superiorNasal: 0 }]),
        leftEye: sectors([{ superiorTemporal: 0 }]),
        label: 'left superior quadrantanopia',
        maculaSpared: false,
      };
    case 'leftParietalRadiation':
      return {
        rightEye: sectors([{ inferiorTemporal: 0 }]),
        leftEye: sectors([{ inferiorNasal: 0 }]),
        label: 'right inferior quadrantanopia',
        maculaSpared: false,
      };
    case 'rightParietalRadiation':
      return {
        rightEye: sectors([{ inferiorNasal: 0 }]),
        leftEye: sectors([{ inferiorTemporal: 0 }]),
        label: 'left inferior quadrantanopia',
        maculaSpared: false,
      };
    case 'leftOccipitalLobe':
      return {
        rightEye: sectors([
          { superiorTemporal: MACULA_SPARING_RESIDUE, inferiorTemporal: MACULA_SPARING_RESIDUE },
        ]),
        leftEye: sectors([{ superiorNasal: MACULA_SPARING_RESIDUE, inferiorNasal: MACULA_SPARING_RESIDUE }]),
        label: 'right homonymous hemianopia with macula sparing',
        maculaSpared: true,
      };
    case 'rightOccipitalLobe':
      return {
        rightEye: sectors([{ superiorNasal: MACULA_SPARING_RESIDUE, inferiorNasal: MACULA_SPARING_RESIDUE }]),
        leftEye: sectors([
          { superiorTemporal: MACULA_SPARING_RESIDUE, inferiorTemporal: MACULA_SPARING_RESIDUE },
        ]),
        label: 'left homonymous hemianopia with macula sparing',
        maculaSpared: true,
      };
  }
}
