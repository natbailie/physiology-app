import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MotorPresetName } from './engine/presets';

export const motorControlContent: ExplainerContent<MotorPresetName> = {
  title: 'Slowness means dopamine, error means cerebellum, and release means involuntary movement',
  sections: [
    {
      heading: 'The basal ganglia run a gate on movement',
      paragraphs: [
        'The basal ganglia run a gate on movement. Striatal dopamine opens it through the direct pathway while the indirect pathway — via the subthalamic nucleus — closes it, and the balance lands on the thalamus driving motor cortex. Deplete dopamine and the indirect side wins unopposed: initiation slows first, then amplitude collapses, then rigidity appears. Load the advanced Parkinson preset: latency triples, the commanded reach lands far short of target (micrographia is the same arithmetic in miniature), the gait turns festinating, and a 4-6 Hz resting tremor emerges at rest — quieting, note, the moment a voluntary command occupies the system.',
      ],
      demos: [
        { preset: 'normal', watch: 'latency' },
        { preset: 'earlyParkinson', watch: 'latency' },
        { preset: 'advancedParkinson', watch: 'amplitude' },
      ],
    },
    {
      heading: 'The cerebellum puts the error inside the action',
      paragraphs: [
        'The cerebellum does something completely different: it calibrates amplitude and timing during movement using sensory feedback. Its failure therefore leaves initiation untouched and puts the error inside the action — intention tremor that worsens as the finger approaches the target, dysmetria past or short of it, broad-based veering gait. Compare the ataxia preset with advanced Parkinson on three readouts and you have the whole bedside distinction examiners ask for: initiation normal versus tripled; tremor during movement versus at rest; hypotonia versus cogwheel rigidity.',
      ],
      demos: [
        { preset: 'cerebellarAtaxia', watch: 'intention tremor' },
        { preset: 'essentialTremor', watch: 'tremor' },
      ],
    },
    {
      heading: 'Release phenomena complete the triad',
      paragraphs: [
        'Release phenomena complete the triad. When the indirect pathway\'s neurons degenerate (Huntington-type), the thalamic brake lifts and random involuntary movement invades a system whose initiation remains entirely normal — chorea. Destroy the subthalamic nucleus itself and the release becomes violent proximal flinging: hemiballismus, the most dramatic involuntary movement in neurology from a lesion smaller than a centimetre. Note the inversion across these presets: parkinsonism is too little movement from too little dopamine; chorea and ballism are too much movement from losing the machinery that suppressed it.',
      ],
      demos: [
        { preset: 'huntingtonChorea', watch: 'involuntary movement' },
        { preset: 'hemiballismus', watch: 'involuntary movement' },
        { preset: 'focalDystonia', watch: 'tone' },
      ],
    },
    {
      heading: 'The pyramidal tract fails differently again',
      paragraphs: [
        'The pyramidal tract fails differently again. Corticospinal damage produces weakness with velocity-dependent spasticity — resistance that gives way suddenly, the clasp-knife sign — brisk reflexes and an upgoing plantar response, but no tremor whatsoever. Tone in parkinsonism behaves oppositely: velocity-independent, ratcheting, present however slowly you move the joint. Rigid versus spastic, resting versus intention tremor, slow start versus scattered execution: each lesion answers one question the others leave clean.',
      ],
      demos: [
        { preset: 'strokeUmnHemiparesis', watch: 'tone' },
      ],
    },
    {
      heading: 'Two treatments demonstrate the circuitry directly',
      paragraphs: [
        'Two treatments demonstrate the circuitry directly. Levodopa transiently restores the depleted transmitter: watch latency fall and amplitude recover over minutes, then decay as the dose wears off — the pharmacological mirror of the disease. Deep brain stimulation damps the pathological oscillator in the circuits themselves, suppressing resting tremor dramatically even though nothing has been repaired. Essential tremor rounds out the differential: a postural tremor with normal initiation, normal tone and no other sign, classically eased by alcohol and beta-blockers — run the suppressant slider to see it yield without anything else changing.',
      ],
    },
  ],
};
