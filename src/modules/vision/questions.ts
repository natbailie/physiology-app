import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { VisionDerived, VisionInputs, VisionInternalState } from './engine/types';
import type { VisionPresetName } from './engine/presets';
import { perturbBrightGlare, perturbLightsOut, perturbShineTorch } from './engine/engine';

type Snapshot = { state: VisionInternalState; derived: VisionDerived };
export type VisionQuestion = ModuleQuestion<VisionInputs, VisionPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Acuity', unit: '/6', value: (s) => s.derived.acuityDenominator, decimals: 0 },
  { label: 'Right pupil', unit: 'mm', value: (s) => s.derived.pupilRightMm, decimals: 1 },
  { label: 'Left pupil', unit: 'mm', value: (s) => s.derived.pupilLeftMm, decimals: 1 },
  { label: 'Anisocoria', unit: 'mm', value: (s) => s.derived.anisocoriaMm, decimals: 1 },
  { label: 'Perceived brightness', unit: '%', value: (s) => s.derived.perceivedBrightness, decimals: 0 },
  {
    label: 'Swinging torch',
    value: (s) => Math.min(s.derived.directReflexRightScore, s.derived.directReflexLeftScore),
    decimals: 0,
    tolerance: 0.25,
  },
];

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
      'The left optic nerve delivers a weak afferent signal, so illuminating THAT eye drives both Edinger-Westphal nuclei poorly and neither pupil constricts properly. Illuminating the healthy right eye still works bilaterally. The pupils being equal at rest matters: anisocoria would point instead at an efferent lesion such as a third-nerve palsy, where consensual constriction of the other eye is preserved. A relative afferent defect localises to the retina or optic nerve.',
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
    prompt: 'What happens to the LEFT pupil?',
    watch: 'left pupil',
    correctDirection: 'falls',
    settleSeconds: 1500,
    observeSeconds: 1200,
    tolerance: 0.02,
    explanation:
      'It constricts consensually, because the afferent limb is intact and the LEFT efferent limb is intact — only the right efferent supply has failed. This is what separates a fixed dilated pupil from an afferent defect: light in the affected eye still moves the healthy eye. Clinically it is also why the finding matters — a pupil that is large because its outgoing parasympathetic supply is cut says nothing about where the light got in.',
    metric: (s) => s.derived.pupilLeftMm,
  },
  {
    id: 'efferent-dead-pupil-itself',
    stem: 'The same patient with a blown right pupil. The torch remains shining in the right eye.',
    setup: { preset: 'fixedDilatedRight' },
    intervention: { label: 'The torch shines in the right eye.', perturb: (state) => perturbShineTorch(state, 1) },
    prompt: 'What happens to the RIGHT pupil?',
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
];
