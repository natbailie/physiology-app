import type { ModuleCase } from '@/shared/cases/types';
import type { VestibularPresetName } from './engine/presets';
import { VERTIGO_PANEL, type VestibularSnapshot } from './panel';

export type VestibularCase = ModuleCase<VestibularPresetName, VestibularSnapshot>;

/**
 * Three beds, one of them twice.
 *
 * James arrives with the room spinning and returns six weeks later with the room still and
 * his vision smearing — the same dead nerve before and after central compensation, which is
 * the arc the module exists to teach. Geoffrey is the counterpoint: the most disabled
 * patient on the ward with the quietest examination, because bilateral loss destroys the
 * comparison vertigo needs. Nothing here is new physiology; what is new is that the numbers
 * belong to somebody, which is the difference between reading a panel and deciding what to
 * do next.
 *
 * Observations are absent on purpose. `chart` points at `VERTIGO_PANEL`, so the five rows
 * are read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const VESTIBULAR_CASES: readonly VestibularCase[] = [
  {
    id: 'james-acute-neuritis',
    bed: 'G01',
    name: 'James',
    age: 32,
    oneLiner: 'Day one: acute rotatory vertigo, vomiting, continuous nystagmus',
    presentation:
      'Woke this morning with the room spinning violently, vomited twice before noon, and now cannot stand without holding the wall. His nystagmus beats continuously toward the left. There is no hearing loss, no headache, no weakness and no slurred speech. His partner wants to know whether this is a stroke, and whether he should have come by ambulance.',
    preset: 'acuteNeuritis',
    chart: VERTIGO_PANEL,
    task: 'Say which nerve has gone silent, and why this is not a stroke.',
    teaching:
      'Continuous spontaneous nystagmus with severe vertigo means an uncompensated firing imbalance: one nerve has gone quiet and the resting tone of the other is being read as acceleration. Beating left says the right nerve is the silent one. No hearing loss separates neuritis from labyrinthitis, no neurology separates it from a posterior stroke, and days-not-seconds separates it from BPPV. The treatment now is vestibular suppressants for the vomiting and then rehabilitation — and in six weeks he will be back in the next bed, feeling cured while the mechanics say otherwise.',
    questionIds: ['acute-neuritis-pattern'],
  },
  {
    id: 'james-compensated',
    bed: 'G02',
    name: 'James',
    age: 32,
    oneLiner: 'Week six: vertigo gone, but words smear on quick head turns',
    presentation:
      'The same man, six weeks after the vertigo that brought him in by ambulance. The spinning stopped within days and he feels entirely well — except that words smear across shop signs when he turns his head quickly in conversation, and he has started moving his whole head like an owl to compensate. He is here because the smearing worries him, and because a friend told him it means the vertigo is coming back.',
    preset: 'compensatedNeuritis',
    chart: VERTIGO_PANEL,
    task: 'Explain why feeling fine and being fine are different things here.',
    teaching:
      'Central compensation has suppressed the firing mismatch — no vertigo, no visible nystagmus — but it cannot rebuild the dead nerve, so the VOR gain stays low and quick head turns outrun the eyes. That dissociation between how he feels and what the mechanics do is why a head impulse belongs in every follow-up: it finds the deficit the symptoms have stopped reporting. Reassurance would waste the visit; vestibular rehabilitation, driving compensation the rest of the way, is the treatment. Compare his own panel from six weeks ago: the vertigo row has emptied while the gain row has barely moved.',
    questionIds: ['compensated-quiet-but-deficient'],
  },
  {
    id: 'geoffrey-bilateral-loss',
    bed: 'G03',
    name: 'Geoffrey',
    age: 73,
    oneLiner: 'On gentamicin, gripping walls, no spinning, worse in the dark',
    presentation:
      'Months of gentamicin for a prosthetic joint infection that nothing else would clear. He walks into clinic gripping the walls, denies any spinning whatsoever, and reports that his vision bobs with every step while corridors after dark have become impassable. His daughter assumed the absence of vertigo meant the balance system was spared, and wants the gentamicin stopped to let it recover.',
    preset: 'bilateralLoss',
    chart: VERTIGO_PANEL,
    task: 'Work out why the most disabled patient here has no vertigo at all.',
    teaching:
      'Bilateral loss destroys the comparison itself: with both nerves quiet there is no imbalance to misread as acceleration, so no vertigo and no nystagmus however disabled he is. Oscillopsia on head motion and darkness-dependent ataxia are the signatures — vision was substituting for the missing vestibular input, and darkness takes the substitute away. Aminoglycosides concentrate in vestibular hair cells, which is why the drug history is the diagnosis; stopping it prevents further loss but the dead hair cells do not regrow. His rehabilitation is learning to live on vision and proprioception, starting with a well-lit corridor.',
    questionIds: ['bilateral-silent-disability'],
  },
];
