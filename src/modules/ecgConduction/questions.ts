import type { PredictQuestion } from '@/shared/assessment/types';
import type { EcgDerived, EcgInputs, EcgState } from './engine/types';
import type { EcgPresetName } from './engine/presets';

type Snapshot = { state: EcgState; derived: EcgDerived };
export type EcgQuestion = PredictQuestion<EcgInputs, EcgPresetName, Snapshot>;

export const ECG_QUESTIONS: readonly EcgQuestion[] = [
  {
    id: 'bundle-block-widens-qrs',
    stem: 'A patient develops a right bundle branch block. The AV node conducts normally and the atria are unaffected.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'Right bundle conduction fails.', inputs: { rightBundleConduction: 0.05 } },
    prompt: 'What happens to the QRS duration?',
    watch: 'the QRS duration',
    correctDirection: 'rises',
    explanation:
      'The QRS widens, because that territory can no longer be activated through the fast conducting system and must instead be depolarised slowly, muscle cell to muscle cell, from the other ventricle. Note what does NOT change: the PR interval is unaffected, because the block is below the AV node. Width without PR prolongation localises the problem to the bundle branches, which is exactly how the two levels of block are told apart.',
    metric: (s) => s.derived.qrsDurationMs,
  },
  {
    id: 'av-delay-lengthens-pr',
    stem: 'A patient is found to have first-degree heart block. Every P wave is still followed by a QRS, and the ventricles themselves conduct normally.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'AV conduction slows markedly.', inputs: { avDelayMs: 320 } },
    prompt: 'What happens to the PR interval?',
    watch: 'the PR interval',
    correctDirection: 'rises',
    explanation:
      'The PR interval lengthens, since it measures the time from atrial activation to ventricular activation and the AV node is what occupies most of it. Note the PR SEGMENT stays flat throughout — not because nothing is happening, but because the AV node holds far too little tissue to register at the body surface. A flat line means no net vector, never no activity, and that distinction is what makes the ECG readable at all.',
    metric: (s) => s.derived.prIntervalMs,
  },
  {
    id: 'rate-shortens-qt',
    stem: 'A patient\'s heart rate rises from 70 to 140. Their electrolytes are normal and they are on no rate-affecting drugs.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'Heart rate doubles to 140.', inputs: { heartRate: 140 } },
    prompt: 'What happens to the raw QT interval?',
    watch: 'the QT interval',
    correctDirection: 'falls',
    explanation:
      'The raw QT shortens, and for a real physiological reason rather than a measurement artefact: action potential duration genuinely shortens as rate rises, because the tissue repolarises faster when driven harder. That is exactly what Bazett\'s correction exists to undo, which is why the CORRECTED value is the one that carries meaning. Watch the QTc stay comparatively stable while the raw QT moves — that is the correction doing its job.',
    metric: (s) => s.derived.qtIntervalMs,
  },
];
