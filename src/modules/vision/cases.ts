import type { ModuleCase } from '@/shared/cases/types';
import type { VisionPresetName } from './engine/presets';
import { PUPIL_PANEL, PRESSURE_PANEL, type VisionSnapshot } from './panel';

export type VisionCase = ModuleCase<VisionPresetName, VisionSnapshot>;

/**
 * Four beds in two mirror pairs.
 *
 * Retinitis pigmentosa and macular degeneration fail in opposite illuminations; acute and
 * open-angle glaucoma destroy the same end organ at opposite tempos. Each pair looks alike
 * at first glance and divides on the panel into opposite managements — which is the whole
 * reason the module keeps three panels instead of one. Nothing here is new physiology; what
 * is new is that the numbers belong to somebody, which is the difference between reading a
 * panel and deciding what to do next.
 *
 * Observations are absent on purpose. Each `chart` points at its panel, so the rows are read
 * off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const VISION_CASES: readonly VisionCase[] = [
  {
    id: 'tom-retinitis-pigmentosa',
    bed: 'E01',
    name: 'Tom',
    age: 35,
    oneLiner: 'Thirties, night driving failing, daylight reading normal',
    presentation:
      'Struggled for years to drive after dark and keeps bumping into furniture in a dim cinema, which he had put down to needing stronger spectacles. His daylight vision and reading are completely normal, and two optometrists have told him his eyes look healthy. He has started avoiding evening shifts at work and wants to know whether glasses will fix it.',
    preset: 'retinitisPigmentosa',
    chart: PUPIL_PANEL,
    task: 'Work out which illumination to ask about first.',
    teaching:
      'Rods failing in the dark while cones carry daylight untouched: the foveal cone mosaic is intact, so acuity is fine, and the pupils are normal because the defect lies behind the reflex arc. The single most useful question in a visual history is often which light exposes the disability — night failure with spared reading points here, while Eleanor in the next bed shows the exact mirror. Spectacles cannot fix a photoreceptor degeneration, which is why two refractions changed nothing.',
    questionIds: ['night-blindness-day-spared'],
  },
  {
    id: 'eleanor-macular-degeneration',
    bed: 'E02',
    name: 'Eleanor',
    age: 76,
    oneLiner: 'Seventies, daylight reading gone, night mobility kept',
    presentation:
      'Cannot read the paper in good light despite new spectacles, and magnification helps less each month. She walks around her house at night without difficulty and has never bumped into anything after dark. Her pupils are equal and reactive, and she is frustrated that every test seems to end with stronger glasses that change nothing.',
    preset: 'macularDegeneration',
    chart: PUPIL_PANEL,
    task: 'Explain why stronger spectacles keep failing her.',
    teaching:
      'Poor acuity in bright light with preserved night mobility points at the cone mosaic — a macular problem, where the optics are innocent and no lens can refocus a failing sensor. The pupils stay equal and reactive because the lesion sits distal to the reflex arc, and perceived brightness reads low even in a bright scene because the retina cannot read the light that is there. Tom next door is the mirror image: his daylight task survives while the night defeats him. Magnifiers and light buy function; nothing here buys back the mosaic.',
    questionIds: ['daylight-reading-blur'],
  },
  {
    id: 'priya-angle-closure',
    bed: 'E03',
    name: 'Priya',
    age: 62,
    oneLiner: 'Painful red eye, hazy cornea, vomiting, pressure crisis',
    presentation:
      'One evening of a painful red eye with a hazy cornea, vomiting and blurred vision. That afternoon she had borrowed hay-fever drops to get through a family lunch outdoors. The eye is hard to palpation, the pupil sits mid-dilated and unreactive, and she keeps asking whether this can wait until the morning clinic.',
    preset: 'acuteAngleClosure',
    chart: PRESSURE_PANEL,
    task: 'Decide whether this is an emergency of hours or a work-up of weeks.',
    teaching:
      'A dilating drop in a shallow angle is the classic provocation: the iris bunches into the drainage route, facility collapses, and pressure reaches crisis within hours — near fifty with most of the angle closed, while chronic disease sits far lower and painless. It cannot wait for morning: without a miotic, acetazolamide and a definitive hole in the iris, the sight is gone. Contrast Arthur, whose identical end organ fails silently over decades and is found by screening rather than by pain.',
    questionIds: ['red-painful-eye'],
  },
  {
    id: 'arthur-open-glaucoma',
    bed: 'E04',
    name: 'Arthur',
    age: 69,
    oneLiner: 'No symptoms, raised pressures, early peripheral field loss',
    presentation:
      'Attended for routine optometry and expected new spectacles. He has no symptoms whatsoever — no pain, no blur, no halos. The pressures are persistently raised and the fields show early peripheral loss he had never noticed. He feels entirely well and is asking, reasonably, why anything needs treating at all.',
    preset: 'openAngleGlaucoma',
    chart: PRESSURE_PANEL,
    task: 'Justify treating a man who feels perfectly fine.',
    teaching:
      'The angle is wide open and nothing hurts: the meshwork simply resists, so production quietly outruns drainage decade after decade, stealing peripheral vision before anyone notices. That silence is the danger and the whole argument for screening — by the time central vision goes, the periphery is already gone. Treatment rebalances the arithmetic from the production side; nothing about the meshwork itself improves. Contrast Priya, whose hours-long crisis announces what his decades-long silence conceals.',
    questionIds: ['silent-pressure-rise'],
  },
];
