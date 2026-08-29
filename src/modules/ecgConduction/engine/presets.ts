import type { EcgInputs } from './types';

export const DEFAULT_ECG_INPUTS: EcgInputs = {
  heartRate: 65,
  avDelayMs: 160,
  avBlockSeverity: 0,
  rightBundleConduction: 1,
  leftBundleConduction: 1,
  ventricularAPD: 300,
  serumPotassium: 4,
  ischemicInjury: 0,
  injuryTerritory: 'inferior',
  lead: 'II',
  rhythm: 'sinus',
};

export type EcgPresetName =
  | 'normalSinus'
  | 'firstDegreeBlock'
  | 'completeHeartBlock'
  | 'rbbb'
  | 'lbbb'
  | 'atrialFibrillation'
  | 'atrialFlutter'
  | 'wpw'
  | 'sickSinus'
  | 'ventricularTachycardia'
  | 'torsades'
  | 'ventricularFibrillation'
  | 'hyperkalemia'
  | 'inferiorStemi'
  | 'anteriorStemi'
  | 'posteriorMi'
  | 'longQt';

export const ECG_PRESETS: Record<EcgPresetName, Partial<EcgInputs>> = {
  normalSinus: { ...DEFAULT_ECG_INPUTS },
  // PR stretches beyond 200 ms but every beat still conducts — the complex itself is normal.
  firstDegreeBlock: { ...DEFAULT_ECG_INPUTS, avDelayMs: 280 },
  // Nothing crosses the AV node, so the ventricles fall back on a ~40 bpm escape pacemaker and
  // the P waves march through the trace completely independently of the QRS complexes.
  completeHeartBlock: { ...DEFAULT_ECG_INPUTS, avBlockSeverity: 1 },
  // The right ventricle has to be activated late, cell-to-cell from the left — widening the QRS.
  rbbb: { ...DEFAULT_ECG_INPUTS, rightBundleConduction: 0.05 },
  // The much larger left ventricle is activated late, so the QRS widens more and the axis swings.
  lbbb: { ...DEFAULT_ECG_INPUTS, leftBundleConduction: 0.05 },
  // No organised atrial activity and an irregularly irregular ventricular response.
  atrialFibrillation: { ...DEFAULT_ECG_INPUTS, rhythm: 'atrialFibrillation' },
  // One circuit at a fixed 300/min; the AV node conducts every second wave, so the
  // ventricles answer with a REGULAR 150 — the rate to think of when you see one.
  atrialFlutter: { ...DEFAULT_ECG_INPUTS, rhythm: 'atrialFlutter' },
  // The accessory pathway beats the AV node to the ventricle: PR shortens below 120 ms and
  // the QRS starts with a slurred delta wave. Compare the PR with normal sinus.
  wpw: { ...DEFAULT_ECG_INPUTS, rhythm: 'wpw' },
  // The SA node fails intermittently; long pauses are filled by junctional escape beats.
  sickSinus: { ...DEFAULT_ECG_INPUTS, rhythm: 'sickSinus' },
  // A ventricular focus takes over: regular, WIDE-complex tachycardia around 180 bpm, with
  // the atria marching independently behind (AV dissociation).
  ventricularTachycardia: { ...DEFAULT_ECG_INPUTS, rhythm: 'ventricularTachycardia' },
  // Polymorphic VT on a long QT: the axis visibly rotates round the baseline. The long-QT
  // substrate is part of the diagnosis — treat the QT, and give magnesium.
  torsades: { ...DEFAULT_ECG_INPUTS, ventricularAPD: 480, rhythm: 'torsades' },
  // No organised depolarisation anywhere; no pulse either. This is an arrest rhythm.
  ventricularFibrillation: { ...DEFAULT_ECG_INPUTS, rhythm: 'ventricularFibrillation' },
  // Tall peaked T waves from accelerated repolarisation, a widening QRS from slowed conduction,
  // and a P wave that flattens away. Compare with the Membrane & Action Potentials module.
  hyperkalemia: { ...DEFAULT_ECG_INPUTS, serumPotassium: 7.2 },
  // Injury current elevates ST in the inferior leads (II, III, aVF) — switch to aVL to see the
  // reciprocal depression appear automatically.
  inferiorStemi: { ...DEFAULT_ECG_INPUTS, ischemicInjury: 0.8, injuryTerritory: 'inferior', lead: 'II' },
  // The territory the limb leads are worst at: elevation across V2-V4 with the frontal leads
  // comparatively quiet, which is why a twelve-lead is not six leads plus decoration.
  anteriorStemi: { ...DEFAULT_ECG_INPUTS, ischemicInjury: 0.8, injuryTerritory: 'anterior', lead: 'V3' },
  // No electrode faces the back of the heart, so this one never elevates anything. It shows up
  // only as its own mirror image — ST DEPRESSION with a tall R in V1 and V2 — which is the
  // classic miss, and the reason the pattern is worth recognising rather than deriving.
  posteriorMi: { ...DEFAULT_ECG_INPUTS, ischemicInjury: 0.8, injuryTerritory: 'posterior', lead: 'V2' },
  // A prolonged action potential stretches the QT, and QTc stays prolonged after rate correction.
  longQt: { ...DEFAULT_ECG_INPUTS, ventricularAPD: 470 },
};

export const ECG_PRESET_LABELS: Record<EcgPresetName, string> = {
  normalSinus: 'Normal sinus',
  firstDegreeBlock: '1st degree AV block',
  completeHeartBlock: 'Complete heart block',
  rbbb: 'RBBB',
  lbbb: 'LBBB',
  atrialFibrillation: 'Atrial fibrillation',
  atrialFlutter: 'Atrial flutter (2:1)',
  wpw: 'WPW pre-excitation',
  sickSinus: 'Sick sinus syndrome',
  ventricularTachycardia: 'Ventricular tachycardia',
  torsades: 'Torsades de pointes',
  ventricularFibrillation: 'Ventricular fibrillation',
  hyperkalemia: 'Hyperkalemia',
  inferiorStemi: 'Inferior STEMI',
  anteriorStemi: 'Anterior STEMI',
  posteriorMi: 'Posterior MI',
  longQt: 'Long QT',
};

export const PRESET_ORDER: EcgPresetName[] = [
  'normalSinus',
  'firstDegreeBlock',
  'completeHeartBlock',
  'rbbb',
  'lbbb',
  'atrialFibrillation',
  'atrialFlutter',
  'wpw',
  'sickSinus',
  'ventricularTachycardia',
  'torsades',
  'ventricularFibrillation',
  'hyperkalemia',
  'inferiorStemi',
  'anteriorStemi',
  'posteriorMi',
  'longQt',
];
