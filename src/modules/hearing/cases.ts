import type { ModuleCase } from '@/shared/cases/types';
import type { HearingPresetName } from './engine/presets';
import { AUDIOGRAM_PANEL, type HearingSnapshot } from './panel';

export type HearingCase = ModuleCase<HearingPresetName, HearingSnapshot>;

/**
 * Three beds, one complaint between them.
 *
 * They were chosen to be the three losses that all answer "I cannot hear" and divide on the
 * two forks the module teaches: WHERE the loss sits, gap or no gap, and WHAT the cochlea
 * still does with what it receives. Nothing here is new physiology; what is new is that the
 * numbers belong to somebody, which is the difference between reading an audiogram and
 * deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `AUDIOGRAM_PANEL`, so the five rows
 * are read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const HEARING_CASES: readonly HearingCase[] = [
  {
    id: 'sarah-otosclerosis',
    bed: 'F01',
    name: 'Sarah',
    age: 33,
    oneLiner: 'Thirties, gradual one-sided loss, fork louder on the mastoid',
    presentation:
      'Notices over two years that the phone has migrated to one ear and the television keeps getting louder. On examination she hears the 512 Hz fork better with its foot on her mastoid than held beside her canal on the bad side, and better beside the canal on the good side. No vertigo, no discharge, no noise history worth naming. She assumed she needed a hearing aid and wants to know which kind.',
    preset: 'otosclerosis',
    chart: AUDIOGRAM_PANEL,
    task: 'Say whether the fault is in the middle ear or the cochlea.',
    teaching:
      'Bone conduction beating air conduction is a negative Rinne, and a negative Rinne means the middle ear is blocking sound a healthy cochlea would happily receive: large air-bone gap, normal bone thresholds, Weber lateralising toward the blocked ear. Nothing is wrong with her cochlea — no recruitment, and discrimination stays intact once sound gets through, which is why a well-fitted aid or a stapes operation both work here. Contrast Dave next door, whose identical complaint comes with no gap at all and for whom amplification alone will always disappoint.',
    questionIds: ['otosclerosis-gap'],
  },
  {
    id: 'dave-noise-damage',
    bed: 'F02',
    name: 'Dave',
    age: 54,
    oneLiner: 'Factory worker, canteen deaf but trays hurt, 4 kHz notch',
    presentation:
      'Twenty years on a press floor without plugs, now unable to follow conversation in the works canteen while wincing when a tray clatters nearby. His thresholds are worst around 4 kHz and fall away less steeply either side. There is no gap between air and bone conduction. He asks whether a hearing aid will fix it, and whether the damage will keep getting worse now he wears defenders.',
    preset: 'noiseNotch',
    chart: AUDIOGRAM_PANEL,
    task: 'Explain why loud hurts him although quiet escapes him.',
    teaching:
      'Deaf to whispers but intolerant of shouts is recruitment: the cochlear amplifier that used to compress loudness is gone, so loudness now grows far too fast with level. The notch centred on 4 kHz is where the canal concentrates noise energy, and the absent air-bone gap puts the fault squarely in the cochlea — which is also why an aid helps less here than for Sarah: amplification cannot restore compression. Presbycusis slopes smoothly instead of notching, and Ménière disease attacks the opposite end of the map. Defenders now stop the notch deepening; nothing fills it back in.',
    questionIds: ['noise-notch-recruitment'],
  },
  {
    id: 'kate-menieres',
    bed: 'F03',
    name: 'Kate',
    age: 47,
    oneLiner: 'Episodic vertigo with fullness, low tones dip during attacks',
    presentation:
      'Months of episodic vertigo lasting hours, each announced by fullness and ringing in one ear. During the attacks her hearing dips noticeably for low-pitched sounds — male voices on the telephone go first — then recovers between episodes. No noise history, no discharge, no neurology. She has been told the episodes are anxiety and wants to know whether the hearing pattern means anything.',
    preset: 'menieres',
    chart: AUDIOGRAM_PANEL,
    task: 'Name which end of the frequency map makes this diagnosis.',
    teaching:
      'Low-frequency sensorineural loss is the audiometric signature here: endolymphatic hydrops distending the apical turn, where the low tones live. Noise sits at 4 kHz and presbycusis takes the highs first, so the shape of the threshold curve discriminates before any other test is ordered — and fluctuating low-tone loss with episodic vertigo and fullness is characteristic, not anxiety. Note what the panel does not show: no gap, so this is sensorineural like Dave, yet at the opposite end of the cochlea and for the opposite reason.',
    questionIds: ['menieres-low-frequencies'],
  },
];
