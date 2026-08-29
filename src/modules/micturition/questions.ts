import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { MicturitionDerived, MicturitionInputs, MicturitionInternalState } from './engine/types';
import type { MicturitionPresetName } from './engine/presets';

type Snapshot = { state: MicturitionInternalState; derived: MicturitionDerived };
export type MicturitionQuestion = ModuleQuestion<MicturitionInputs, MicturitionPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  {
    label: 'Volume',
    unit: 'mL',
    value: (s) => s.derived.bladderVolumeML,
    decimals: 0,
    tolerance: 0.08,
  },
  {
    label: 'Pressure',
    unit: 'cmH₂O',
    value: (s) => s.derived.intravesicalPressureCmH2O,
    decimals: 1,
    tolerance: 0.12,
  },
  {
    label: 'Detrusor',
    value: (s) => s.derived.detrusorTone,
    decimals: 2,
    tolerance: 0.15,
  },
  {
    label: 'Sphincter',
    value: (s) => s.derived.externalSphincterTone,
    decimals: 2,
    tolerance: 0.15,
  },
  {
    label: 'Afferent',
    value: (s) => s.derived.afferentFiringRate,
    decimals: 2,
    tolerance: 0.2,
  },
];

/** Settle long enough for filling dynamics to produce a measurable pattern. */
const SETTLE = 3600;

export const MICTURITION_QUESTIONS: readonly MicturitionQuestion[] = [
  {
    id: 'normal-storage',
    stem: 'A healthy woman is resting quietly. She last voided two hours ago and has not drunk much since.',
    setup: { perturb: (s) => ({ ...s, bladderVolumeML: 250 }) },
    answer: 'filling',
    options: ['filling', 'detrusorOveractivity', 'stressIncontinence', 'overflowIncontinence'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The bladder fills steadily with low detrusor tone and strong sphincter closure — the sympathetic keep-storage programme at work. Pressure rises passively with volume but remains well below the sphincter closing threshold. The afferent firing is mild, producing only a first desire. In detrusor overactivity the detrusor would be contracting involuntarily; in stress incontinence the sphincter would be weak; in overflow the volume would be near capacity with no detrusor tone.',
  },
  {
    id: 'involuntary-contraction',
    stem: 'A 65-year-old man complains of sudden, uncontrollable urgency with small-volume frequency. He cannot get to the toilet in time.',
    setup: { perturb: (s) => ({ ...s, bladderVolumeML: 200 }) },
    answer: 'detrusorOveractivity',
    options: ['filling', 'detrusorOveractivity', 'stressIncontinence', 'overflowIncontinence'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The detrusor is contracting at a volume well below the normal micturition threshold — the hallmark of detrusor overactivity. The parasympathetic reflex fires prematurely, generating urgency and involuntary pressure rises. The sphincter may still be contracted but the detrusor pressure can spike above the closing threshold during contractions. In normal filling the detrusor would be quiet; in stress incontinence the sphincter would be weak; in overflow there would be no detrusor tone at all.',
  },
  {
    id: 'weak-closure',
    stem: 'A multiparous woman leaks urine when she coughs, sneezes or lifts heavy objects. She has no urgency between episodes.',
    setup: { perturb: (s) => ({ ...s, bladderVolumeML: 350 }) },
    answer: 'stressIncontinence',
    options: ['filling', 'detrusorOveractivity', 'stressIncontinence', 'overflowIncontinence'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The sphincter closing pressure is far below normal — the external urethral sphincter cannot generate enough resistance to contain the intravesical pressure at moderate volumes. Even without detrusor contraction, the pressure gradient can exceed the sphincter threshold and cause leakage. In detrusor overactivity the problem is involuntary detrusor contraction; in overflow the detrusor is too weak to contract; in normal filling the sphincter is competent.',
  },
  {
    id: 'cannot-empty',
    stem: 'An elderly man with long-standing diabetes presents with a palpable bladder and overflow dribbling. He has been unable to initiate voiding for several hours.',
    setup: { perturb: (s) => ({ ...s, bladderVolumeML: 500 }) },
    answer: 'overflowIncontinence',
    options: ['filling', 'detrusorOveractivity', 'stressIncontinence', 'overflowIncontinence'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The bladder is near capacity but the detrusor generates almost no tone — the motor neuropathy of diabetes has denervated the smooth muscle. Pressure remains low despite the high volume, and the sphincter is the only thing preventing complete emptying. The passive pressure at this volume is close to the sphincter closing pressure, causing overflow dribbling. In detrusor overactivity the detrusor would be overactive; in stress incontinence the sphincter would be weak; in normal filling the volume would be much lower.',
  },
  {
    id: 'squeeze-to-void',
    stem: 'A medical student is demonstrating voluntary voiding. She relaxes her pelvic floor to initiate micturition.',
    setup: { preset: 'filling', perturb: (s) => ({ ...s, bladderVolumeML: 400 }) },
    intervention: {
      label: 'She relaxes her external sphincter completely.',
      inputs: { voluntarySphincterPct: 5, parasympatheticPct: 80, sympatheticPct: 10 },
    },
    prompt: 'What happens to the bladder volume?',
    watch: 'volume',
    correctDirection: 'falls',
    settleSeconds: 3600,
    observeSeconds: 600,
    explanation:
      'Volume drops rapidly because relaxing the sphincter removes the pressure barrier — intravesical pressure now exceeds the sphincter closing threshold and turbulent flow through the urethra empties the bladder. The parasympathetic drive contracts the detrusor, further increasing the pressure gradient. This is the normal micturition sequence: the pontine micturition centre coordinates detrusor contraction with sphincter relaxation.',
    metric: (s) => s.derived.bladderVolumeML,
  },
  {
    id: 'cortex-holds-on',
    stem: 'A man is at a meeting and feels a strong urge to void. He clenches his pelvic floor and tries to delay.',
    setup: { preset: 'strongUrge', perturb: (s) => ({ ...s, bladderVolumeML: 420 }) },
    intervention: {
      label: 'He voluntarily contracts his external sphincter and inhibits the reflex.',
      inputs: { voluntarySphincterPct: 95, cortexInhibitsMicturition: true },
    },
    prompt: 'What happens to the detrusor tone?',
    watch: 'detrusor',
    correctDirection: 'falls',
    settleSeconds: 3600,
    observeSeconds: 600,
    explanation:
      'Detrusor tone falls because cortical inhibition dampens the parasympathetic reflex arc — the brainstem voiding centre is suppressed even though the afferent signal is screaming. The strong voluntary sphincter contraction also triggers a reflex inhibition of detrusor tone via the guarding reflex. This is how healthy adults defer voiding: the cortex overrides the reflex, buying time until a toilet is available.',
    metric: (s) => s.derived.detrusorTone,
  },
];
