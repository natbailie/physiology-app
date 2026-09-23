import type { ModuleQuestion } from '@/shared/assessment/types';
import type { VisionInputs } from './engine/types';
import type { VisionPresetName } from './engine/presets';
import { perturbBrightGlare, perturbLightsOut, perturbShineTorch } from './engine/engine';
import { PUPIL_PANEL as PANEL, PRESSURE_PANEL, FIELD_PANEL, type VisionSnapshot as Snapshot } from './panel';

export type VisionQuestion = ModuleQuestion<VisionInputs, VisionPresetName, Snapshot>;

const SETTLE = 5000;

export const VISION_QUESTIONS: readonly VisionQuestion[] = [
  {
    id: 'night-blindness-day-spared',
    stem: 'A man in his thirties has struggled for years to drive at night and bumps into furniture in a dim cinema. His daylight vision and reading are normal.',
    answer: 'retinitisPigmentosa',
    options: ['retinitisPigmentosa', 'macularDegeneration', 'starlight', 'opticNeuritisLeft'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Rods fail in the dark while cones carry daylight untouched — the signature of retinitis pigmentosa. The acuity is fine because the foveal cone mosaic is intact, and the pupils are normal because the defect lies behind the reflex arc. Macular degeneration is the mirror image: it ruins daylight reading and spares the night. Asking which illumination exposes the disability is often the single most useful question in a visual history.',
  },
  {
    id: 'daylight-reading-blur',
    stem: 'A woman in her seventies cannot read the paper in good light despite new spectacles. She walks around her house at night without difficulty.',
    answer: 'macularDegeneration',
    options: ['macularDegeneration', 'retinitisPigmentosa', 'normalDaylight', 'fixedDilatedRight'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Poor acuity in bright light with preserved night mobility points at the cone mosaic — a macular problem. Note the pupils are equal and reactive, because the lesion is distal to the reflex arc, and perceived brightness is low even though the scene is bright: the retina cannot read the light that is there. Retinitis pigmentosa would give exactly the opposite pattern, sparing this kind of central daylight task until very late.',
  },
  {
    id: 'swinging-torch-rapd',
    stem: 'During the swinging-torch test, light shone in one eye constricts neither pupil well — but when the torch rests in the other eye, both pupils constrict briskly. The pupils are equal at rest.',
    answer: 'opticNeuritisLeft',
    options: ['opticNeuritisLeft', 'fixedDilatedRight', 'normalDaylight', 'macularDegeneration'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The left optic nerve delivers a weak afferent signal, so illuminating that eye drives both Edinger-Westphal nuclei poorly and neither pupil constricts properly. Illuminating the healthy right eye still works bilaterally. The pupils being equal at rest matters: anisocoria would point instead at an efferent lesion such as a third-nerve palsy, where consensual constriction of the other eye is preserved. A relative afferent defect localises to the retina or optic nerve.',
  },
  {
    id: 'lights-out-dilates',
    stem: 'A patient sits in a dimly lit room. The last lamp is switched off.',
    setup: { preset: 'dimRestaurant' },
    intervention: { label: 'Ambient luminance falls by two and a half log units.', perturb: (state) => perturbLightsOut(state) },
    prompt: 'What happens to pupil diameter?',
    watch: 'pupil diameter',
    correctDirection: 'rises',
    settleSeconds: 2000,
    observeSeconds: 2500,
    explanation:
      'It rises — the pupil dilates toward its dark-adapted diameter over several seconds. The reflex tracks raw retinal illuminance rather than perceived brightness, which is why the change begins immediately, long before dark adaptation has made the scene feel visible again. Run it from any starting scene and the direction is the same; what disease changes is how much of the response survives.',
    metric: (s) => s.derived.pupilRightMm,
  },
  {
    id: 'consensual-reflex-efferent-dead',
    stem: 'A patient presents with a blown right pupil that does not react to light. A torch is shone directly into that right eye.',
    setup: { preset: 'fixedDilatedRight' },
    intervention: { label: 'The torch shines in the unreactive right eye.', perturb: (state) => perturbShineTorch(state, 1) },
    prompt: 'What happens to the left pupil?',
    watch: 'left pupil',
    correctDirection: 'falls',
    settleSeconds: 1500,
    observeSeconds: 1200,
    tolerance: 0.02,
    explanation:
      'It constricts consensually, because the afferent limb is intact and the left efferent limb is intact — only the right efferent supply has failed. This is what separates a fixed dilated pupil from an afferent defect: light in the affected eye still moves the healthy eye. Clinically it is also why the finding matters — a pupil that is large because its outgoing parasympathetic supply is cut says nothing about where the light got in.',
    metric: (s) => s.derived.pupilLeftMm,
  },
  {
    id: 'efferent-dead-pupil-itself',
    stem: 'The same patient with a blown right pupil. The torch remains shining in the right eye.',
    setup: { preset: 'fixedDilatedRight' },
    intervention: { label: 'The torch shines in the right eye.', perturb: (state) => perturbShineTorch(state, 1) },
    prompt: 'What happens to the right pupil?',
    watch: 'right pupil',
    correctDirection: 'unchanged',
    settleSeconds: 1500,
    observeSeconds: 1200,
    tolerance: 0.02,
    explanation:
      'Barely changes — the signal arrives fine but there is nothing to carry the command out. Constriction is the efferent arm doing work, so a dead efferent arm means no constriction however bright the light. Compare this with the previous question and you have the complete efferent picture: consensual response preserved in the healthy eye, direct response abolished in the affected one, anisocoria at rest throughout.',
    metric: (s) => s.derived.pupilRightMm,
  },
  {
    id: 'flash-bleaches-rods',
    stem: 'A photographer is taking pictures under a starlit sky, flash firing directly into the subjects\' eyes. For several minutes afterwards they cannot make out the path in front of them.',
    setup: { preset: 'starlight' },
    intervention: { label: 'The flash bleaches rod pigment wholesale.', perturb: (state) => perturbBrightGlare(state) },
    prompt: 'What happens to perceived brightness of the unchanged scene?',
    watch: 'perceived brightness',
    correctDirection: 'falls',
    settleSeconds: 4000,
    observeSeconds: 360,
    explanation:
      'It falls sharply, although not a photon of ambient light has changed. The flash bleached rhodopsin wholesale, pushing the rods\' operating range far above the dim scene until pigment regenerates over minutes — the slow phase of dark adaptation. Sensitivity is a property of the detector as much as of the light, which is why the same street looks black after a flash and normal ten minutes later.',
    metric: (s) => s.derived.perceivedBrightness,
  },
  {
    id: 'md-dim-room-acuity-collapses',
    stem: 'A patient with known macular degeneration reads reasonably with good magnification and strong light. She walks from a bright hallway into a darkened cinema to find her seat.',
    setup: { preset: 'macularDegeneration' },
    intervention: { label: 'Ambient luminance falls to starlight levels.', inputs: { sceneLuminanceLogCd: -4 } },
    prompt: 'What happens to Snellen acuity (the denominator)?',
    watch: 'acuity',
    correctDirection: 'rises',
    settleSeconds: 2500,
    observeSeconds: 3000,
    explanation:
      'The denominator climbs steeply — acuity collapses onto the peripheral rod ceiling of roughly 6/60 once cones can no longer operate. Everyone loses acuity in the dark, but the fovea-first diseases lose it hardest, because the retina left doing the seeing was never built for resolution. It is why patients with macular disease describe dusk as a cliff edge rather than a slope.',
    metric: (s) => s.derived.acuityDenominator,
  },
  {
    id: 'red-painful-eye',
    stem: 'A woman in her sixties presents one evening with a painful red eye, a hazy cornea, vomiting and blurred vision. She had used her grandson\'s hay-fever drops that afternoon.',
    answer: 'acuteAngleClosure',
    options: ['acuteAngleClosure', 'openAngleGlaucoma', 'treatedGlaucoma', 'fixedDilatedRight'],
    panel: PRESSURE_PANEL,
    settleSeconds: 11000,
    explanation:
      'A dilating drop in a shallow angle is the classic provocation for acute closure: the iris bunches into the drainage route, facility collapses, and pressure reaches crisis within hours. The panel tells the story — pressure near fifty with most of the angle closed, while chronic glaucoma sits far lower and painless. This is an emergency of hours, not a work-up of weeks: without a miotic, acetazolamide and definitive iridotomy the sight is gone.',
  },
  {
    id: 'silent-pressure-rise',
    stem: 'A man attends for routine optometry. He has no symptoms whatsoever. The pressure readings are persistently raised and his visual fields show early peripheral loss.',
    answer: 'openAngleGlaucoma',
    options: ['openAngleGlaucoma', 'acuteAngleClosure', 'normalDaylight', 'treatedGlaucoma'],
    panel: PRESSURE_PANEL,
    settleSeconds: 9000,
    explanation:
      'The angle is wide open and nothing hurts — the meshwork simply resists, so production quietly outruns drainage decade after decade. That silence is the danger: the disease steals peripheral vision before anyone notices, which is why screening matters. Compare it with the closure preset at the same panel and the teaching point writes itself — the same end organ, two utterly different tempos.',
  },
  {
    id: 'hemianopia-macular-sparing',
    stem: 'A retired teacher reports bumping into doorframes on one side for a week. She walks into the clinic furniture on her left, reads perfectly, and has otherwise been well.',
    answer: 'occipitalInfarctRight',
    options: ['occipitalInfarctRight', 'chiasmalCompression', 'meyersLoopLeft', 'normalDaylight'],
    panel: FIELD_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The entire left field of both eyes has fallen, yet reading survives — central vision is spared because the occipital pole has a dual arterial supply. A chiasmal lesion would take both temporal fields instead, and Meyer\'s loop would claim only a superior quadrant. Homonymous means the same side of each eye; sparing the macula puts the lesion confidently in the posterior cortex, not the eye or the nerve.',
  },
  {
    id: 'pie-in-the-sky',
    stem: 'A man is noted on visual testing to lack the upper outer quadrant of vision in each eye. He had a partial temporal lobectomy some months ago for epilepsy.',
    answer: 'meyersLoopLeft',
    options: ['meyersLoopLeft', 'chiasmalCompression', 'occipitalInfarctRight', 'normalDaylight'],
    panel: FIELD_PANEL,
    settleSeconds: SETTLE,
    explanation:
      "Meyer's loop fans through the temporal lobe carrying fibres from the contralateral superior retina, so surgery there leaves a pie in the sky — loss of the upper quadrant of the opposite field in both eyes. The inferior quadrants survive intact, which separates this cleanly from a hemianopia, and both eyes are affected equally, which separates it from anything monocular.",
  },
  {
    id: 'acetazolamide-lowers-pressure',
    stem: 'A patient with chronically raised intraocular pressure is started on oral acetazolamide.',
    setup: { preset: 'openAngleGlaucoma' },
    intervention: { label: 'Acetazolamide reaches 70% effect.', inputs: { acetazolamideDosePct: 70 } },
    prompt: 'What happens to intraocular pressure?',
    watch: 'intraocular pressure',
    correctDirection: 'falls',
    settleSeconds: 2000,
    observeSeconds: 7000,
    explanation:
      'It falls, over simulated hours — the drug blocks carbonic anhydrase in the ciliary epithelium, slowing production to meet a resistant outflow halfway. Nothing about the meshwork itself has improved; the arithmetic has merely been rebalanced from the other side. It is the same logic as any secretory organ: when drainage cannot rise, demand must fall.',
    metric: (s) => s.derived.intraocularPressureMmHg,
  },
  {
    id: 'pilocarpine-relieves-closure',
    stem: 'The woman with the red, painful, hard eye and a mid-dilated pupil is diagnosed with acute angle closure. Pilocarpine drops are instilled.',
    setup: { preset: 'acuteAngleClosure' },
    intervention: { label: 'Pilocarpine reaches 90% effect.', inputs: { pilocarpineDosePct: 90 } },
    prompt: 'What happens to intraocular pressure?',
    watch: 'intraocular pressure',
    correctDirection: 'falls',
    settleSeconds: 9000,
    observeSeconds: 8000,
    explanation:
      'It falls steeply — but not because pilocarpine drains fluid past the blockage. The miotic contracts the ciliary muscle, which pulls the peripheral iris physically out of the angle and tensions the meshwork open behind it; facility returns and the pressure follows. Acetazolamide buys time by slowing the tap, but reopening the angle is what actually ends the crisis — which is why the definitive treatment is a hole in the iris, not another infusion.',
    metric: (s) => s.derived.intraocularPressureMmHg,
  },
  {
    id: 'mydriatic-wide-angle-safe',
    stem: 'A young patient with normal eyes and widely open angles needs a dilated fundus examination. Tropicamide is instilled.',
    setup: { preset: 'normalDaylight' },
    intervention: { label: 'Mydriatic reaches 90% effect.', inputs: { mydriaticDosePct: 90 } },
    prompt: 'What happens to intraocular pressure?',
    watch: 'intraocular pressure',
    correctDirection: 'unchanged',
    settleSeconds: 3000,
    observeSeconds: 5000,
    explanation:
      'Barely moves. A dilated pupil only becomes dangerous where there is nowhere for the iris to go: in a wide-open angle the same pharmacology produces a big black pupil and a perfectly safe eye. This is exactly why the drop that routinely blinds nobody in clinic can precipitate a crisis in the hypermetropic, shallow-angled eye — the risk was never in the drug, it was in the architecture it acted upon.',
    metric: (s) => s.derived.intraocularPressureMmHg,
  },
  {
    id: 'presbyopia-near-blur',
    stem: 'A presbyopic editor can see the studio clock clearly across the room but cannot focus on her own copy at half a metre.',
    setup: {
      inputs: { maximumAccommodationD: 1.5, targetDistanceMetres: 6 },
    },
    intervention: { label: 'She looks down at copy held at 40 cm.', inputs: { targetDistanceMetres: 0.4 } },
    prompt: 'What happens to her accommodative deficit?',
    watch: 'accommodation',
    correctDirection: 'rises',
    settleSeconds: 100,
    observeSeconds: 100,
    explanation:
      'It rises from nothing: 40 cm demands 2.5 dioptres against a lens holding perhaps 1.5, and the shortfall beyond the eye\'s depth of focus is blur. The distance target asked almost nothing, which is why her distance vision feels untouched. Presbyopia is the one refractive failure that afflicts every human who keeps their eyes long enough — a lens problem wearing a retina\'s alibi.',
    metric: (s) => s.derived.accommodationDeficitD,
  },
];
