import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { HearingDerived, HearingInputs, HearingInternalState } from './engine/types';
import type { HearingPresetName } from './engine/presets';
import { perturbNoiseExposure } from './engine/engine';

type Snapshot = { state: HearingInternalState; derived: HearingDerived };
export type HearingQuestion = ModuleQuestion<HearingInputs, HearingPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'PTA', unit: 'dB', value: (s) => s.derived.ptaDb, decimals: 0 },
  { label: 'Air-bone gap', unit: 'dB', value: (s) => s.derived.airBoneGapDb, decimals: 0 },
  { label: 'Speech discrimination', unit: '%', value: (s) => s.derived.speechDiscriminationPct, decimals: 0 },
  {
    label: 'Recruitment',
    unit: '×',
    value: (s) => s.derived.recruitmentIndex,
    decimals: 2,
    tolerance: 0.15,
  },
  { label: 'Weber', value: (s) => s.derived.weberCode, decimals: 0, tolerance: 0.5 },
];

const SETTLE = 3000;

export const HEARING_QUESTIONS: readonly HearingQuestion[] = [
  {
    id: 'otosclerosis-gap',
    stem: 'A woman in her thirties notices gradually worsening hearing, worse in one ear. She hears the tuning fork better on her mastoid process than beside her ear canal.',
    answer: 'otosclerosis',
    options: ['otosclerosis', 'noiseNotch', 'presbycusis', 'menieres'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Bone conduction beats air conduction — a negative Rinne — which means the middle ear is blocking sound the cochlea would happily receive. The audiogram shows a large air-bone gap with bone thresholds normal and Weber lateralising toward the blocked ear. Nothing is wrong with the cochlea itself: no recruitment, and discrimination stays intact once sound gets through. Stapes fixation from otosclerosis is the classic cause in a young adult.',
  },
  {
    id: 'noise-notch-recruitment',
    stem: 'A factory worker has years of unprotected noise exposure. He complains he cannot follow conversation in the canteen yet winces at clattering trays. His thresholds are worst around 4 kHz.',
    answer: 'noiseNotch',
    options: ['noiseNotch', 'otosclerosis', 'menieres', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Deaf to whispers but intolerant of shouts is recruitment — loudness growing abnormally fast because the cochlear amplifier that used to compress is gone. The notch centred on 4 kHz is where the external canal concentrates noise energy, and there is no air-bone gap: the loss is in the cochlea. Presbycusis also gives sensorineural loss but slopes smoothly rather than notching, and Ménière disease attacks the opposite end of the frequency map.',
  },
  {
    id: 'menieres-low-frequencies',
    stem: 'During episodes of vertigo with aural fullness and tinnitus, a patient\'s hearing dips noticeably for low-pitched sounds such as male voices.',
    answer: 'menieres',
    options: ['menieres', 'noiseNotch', 'presbycusis', 'otosclerosis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Low-frequency sensorineural loss is the audiometric signature of Ménière disease — endolymphatic hydrops distending the apical part of the membranous labyrinth. Noise damage sits at 4 kHz and presbycusis takes the highs first, so the SHAPE of the threshold curve discriminates between them before any other test is ordered. Combined with episodic vertigo and fluctuating low-tone hearing, the pattern is characteristic.',
  },
  {
    id: 'conductive-drops-audibility-not-clarity',
    stem: 'A patient with a middle-ear effusion listens to conversational speech at ordinary effort.',
    setup: { preset: 'normal' },
    intervention: { label: "A 45 dB conductive loss develops (effusion).", inputs: { conductiveLossDb: 45 } },
    prompt: 'What happens to speech discrimination at conversational level?',
    watch: 'speech discrimination',
    correctDirection: 'falls',
    settleSeconds: 1500,
    observeSeconds: 1000,
    explanation:
      'It falls — but only because the words have become INAUDIBLE, not garbled: the cochlea never receives them. Turn the volume up past the gap and discrimination returns to normal, which is why conductive loss is the best candidate for surgical or mechanical correction. Contrast this with inner hair cell failure, where even amplified speech stays distorted because the transducer itself is gone.',
    metric: (s) => s.derived.speechDiscriminationPct,
  },
  {
    id: 'tts-after-exposure',
    stem: 'A music fan stands beside the speakers at a concert without earplugs. Walking out, everything sounds muffled and dulled.',
    setup: { preset: 'normal' },
    intervention: { label: 'A loud exposure adds temporary threshold shift.', perturb: (state) => perturbNoiseExposure(state) },
    prompt: 'What happens to the pure-tone average?',
    watch: 'PTA',
    correctDirection: 'rises',
    settleSeconds: 1500,
    observeSeconds: 800,
    explanation:
      'Thresholds rise — temporary threshold shift, the reversible cousin of noise damage, recovering over hours as the cochlea restores its metabolically exhausted amplifier. The muffling is real deafness, just temporary. It matters clinically because each episode of shift marks hair-cell stress that accumulates across exposures into the permanent 4 kHz notch; the earplugs were the cheaper option.',
    metric: (s) => s.derived.ptaDb,
  },
  {
    id: 'ihc-loss-destroys-discrimination',
    stem: 'An elderly patient\'s hearing loss has been progressing. Even with the television loud enough, she says people sound as if they are mumbling.',
    setup: { preset: 'presbycusis' },
    intervention: { label: 'Inner hair cell function deteriorates further.', inputs: { innerHairCellIntegrity: 0.25 } },
    prompt: 'What happens to speech discrimination?',
    watch: 'speech discrimination',
    correctDirection: 'falls',
    settleSeconds: 1500,
    observeSeconds: 1200,
    explanation:
      'It falls even though amplification could still make the sound loud enough — "mumbling" that persists when volume rises is the hallmark of a transducer problem. Inner hair cells feed the auditory nerve directly; when they fail, timing and place information arrive distorted no matter how much gain is applied. This is why hearing-aid disappointment is common in advanced sensorineural loss, and why discrimination testing earns its place beside the pure-tone audiogram.',
    metric: (s) => s.derived.speechDiscriminationPct,
  },
  {
    id: 'stapedius-reflex-engages',
    stem: 'A patient with healthy ears is exposed to a sustained 105 dB HL tone in the tested ear.',
    setup: { preset: 'normal' },
    intervention: { label: 'Stimulus level rises to 105 dB HL.', inputs: { stimulusLevelDbHl: 105 } },
    prompt: 'What happens to stapedius contraction?',
    watch: 'stapedius',
    correctDirection: 'rises',
    settleSeconds: 1000,
    observeSeconds: 600,
    explanation:
      'It contracts — the acoustic reflex engages above roughly 85 dB HL and stiffens the ossicular chain within milliseconds, buying a few decibels of protection tuned mostly to low frequencies. It is the ear\'s own compressor working alongside the cochlea\'s neural one. Note what it cannot do: react fast enough for impulsive noise, and it does nothing at all if the middle ear cannot move, which is why reflex testing doubles as an ossicular check.',
    metric: (s) => s.state.stapediusContraction,
  },
];
