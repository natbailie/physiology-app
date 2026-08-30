import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { VisionPresetName } from './engine/presets';

export const visionContent: ExplainerContent<VisionPresetName> = {
  title: 'Two receptor systems share one retina, and each owns a different kind of blindness',
  sections: [
    {
      heading: 'Two receptor systems over ten billion to one of luminance',
      paragraphs: [
        'The retina runs two receptor systems in parallel over a luminance range of about ten billion to one. Cones sit crowded into the fovea, work in daylight, and give you colour and acuity; rods dominate the periphery, work from moonlight down to starlight, and give you sensitivity at the cost of resolution. The two hand over in the mesopic band — dusk, a dim restaurant — where neither is comfortable, and the crossover explains a small library of everyday phenomena. Look slightly beside a faint star and it brightens: you have moved the image off the rod-free fovea onto rod-rich periphery. Your peripheral vision is colourless at night for the same reason.',
      ],
      demos: [
        { preset: 'normalDaylight', watch: 'acuity' },
        { preset: 'dimRestaurant', watch: 'acuity' },
        { preset: 'starlight', watch: 'acuity' },
      ],
    },
    {
      heading: 'Transduction runs backwards from what you would design',
      paragraphs: [
        'Transduction runs backwards from what you would design. Light does not excite the photoreceptor; it HYPERpolarises it, closing cGMP-gated sodium channels, and the falling membrane potential reduces glutamate release at the synapse. It is the fall in glutamate that the ON-bipolar cell reads as light. Watch the glutamate readout as you darken the room: it climbs toward its dark maximum. This sign inversion is not trivia — it is why retinitis pigmentosa can destroy 95 per cent of rods yet spare daylight vision completely, because the cones carry the photopic signal on their own wiring.',
      ],
    },
    {
      heading: 'Adaptation happens on three timescales at once',
      paragraphs: [
        'Adaptation is the retina moving its operating range to match the background, and it happens on three timescales at once. Cone adaptation follows the scene within seconds; rod dark adaptation has a quick early phase and then a slow one lasting tens of minutes while rhodopsin regenerates. Run a camera flash on the starlight preset and watch brightness collapse: the light is unchanged, but the pigment that reads it has been bleached wholesale, and no amount of wanting will restore sensitivity before the chemistry does. This is also why the pupil reflex tracks raw luminance rather than perceived brightness — long after you feel adapted to a dark cinema your pupils are still wide.',
      ],
    },
    {
      heading: 'The pupil divides into an afferent and an efferent limb',
      paragraphs: [
        'The pupil reflex divides clinically into an afferent limb and an efferent limb, and the division does real diagnostic work. The afferent signal from either eye reaches both Edinger-Westphal nuclei, so direct and consensual responses are equal by construction. Load the optic neuritis preset: the pupils are equal at rest, but shining the torch in the affected eye constricts neither well, because the damaged nerve delivers only a weak signal to both nuclei. That is a relative afferent pupillary defect — the swinging-torch finding. Now load the fixed dilated pupil: here the right efferent supply is gone, so the right pupil stays large whatever you do, yet shining light in either eye constricts the left normally. Afferent lesions make pupils equal and reflexes asymmetric; efferent lesions make pupils unequal and leave the healthy eye untouched.',
      ],
      demos: [
        { preset: 'opticNeuritisLeft', watch: 'pupil' },
        { preset: 'fixedDilatedRight', watch: 'pupil' },
      ],
    },
    {
      heading: 'Acuity belongs to cones, so it collapses in dim light',
      paragraphs: [
        'Acuity belongs almost entirely to cones, which is why it collapses in dim light even in healthy eyes. Under starlight the fovea — packed with cones and starved of rods — contributes essentially nothing, and resolution falls toward the rod periphery ceiling of roughly 6/60. Compare the starlight preset with normal daylight and watch the Snellen denominator climb twenty-fold with nothing whatsoever wrong with the eye. Now load macular degeneration: the scene is bright, the pupils react perfectly, night vision is intact, and yet acuity is 6/36 or worse, because the cone mosaic that performs daylight reading has been lost where it matters most.',
      ],
    },
    {
      heading: 'Ask which system failed, and under what lighting',
      paragraphs: [
        'The clinical patterns separate cleanly once you ask which system failed and under what lighting. Retinitis pigmentosa is a rod disease: night blindness and peripheral loss, with daylight acuity preserved for years. Macular degeneration is a cone disease: central blur in good light, normal pupillary reflexes, no trouble walking through a dark room. Optic neuritis announces itself on the swinging torch; a surgical third-nerve palsy announces itself as a blown pupil with the other one reacting. The presets are built so those distinctions fall out of the numbers rather than out of memorisation.',
      ],
      demos: [
        { preset: 'retinitisPigmentosa', watch: 'peripheral field' },
        { preset: 'macularDegeneration', watch: 'acuity' },
      ],
    },
    {
      heading: 'The eye manufactures its own pressure',
      paragraphs: [
        'The eye manufactures its own pressure. The ciliary body pumps out around two and a half microlitres of aqueous a minute, and the trabecular meshwork drains it against the episcleral venous pressure — so intraocular pressure is simply production divided by facility, added onto the veins. That arithmetic explains both glaucomas. In the open-angle disease the meshwork silently resists and pressure creeps up over years, painless while it strangles peripheral vision. In angle closure the iris itself piles into the drainage route — usually provoked by a dilating pupil in an already shallow eye — and pressure reaches crisis within hours: a red, painful, hard eye with a hazy cornea and a mid-dilated fixed pupil that must be treated the same night. Notice what the model makes obvious: pilocarpine works twice in a crisis, because miotics do not slow any pump — they pull the iris physically out of the angle and drag the meshwork open with it.',
      ],
      demos: [
        { preset: 'openAngleGlaucoma', watch: 'intraocular pressure' },
        { preset: 'acuteAngleClosure', watch: 'intraocular pressure' },
        { preset: 'treatedGlaucoma', watch: 'intraocular pressure' },
      ],
    },
    {
      heading: 'Accommodation is the youngest thing in the eye',
      paragraphs: [
        'Accommodation is the youngest thing in the eye. The lens rounds when the ciliary muscle slackens its zonules, delivering dioptres of power on demand alongside convergence and pupillary constriction — the near triad acting as one. But the lens cannot renew its cells, and its amplitude falls from roughly twelve dioptres in childhood to two or three by middle age. Distance vision survives untouched; reading goes first. That asymmetry is the whole diagnosis of presbyopia: the patient holding the menu at arm\'s length has a stiffening lens behind a perfectly healthy retina, and no amount of brighter lighting fixes what a convex add fixes instantly.',
      ],
      demos: [
        { preset: 'presbyopia', watch: 'near point' },
      ],
    },
    {
      heading: 'Field defects are geography',
      paragraphs: [
        'Field defects are geography. Each visual hemisphere travels a fixed route: nasal retinal fibres cross at the chiasm, temporal fibres stay ipsilateral, the tract carries the opposite field whole, Meyer\'s loop swings through the temporal lobe carrying that field\'s superior quadrant, and the occipital pole enjoys a dual arterial supply that spares fixation when infarcted. Because the wiring never varies, the site dictates the defect: bitemporal loss means something is sitting on the chiasm; pie-in-the-sky quadrantanopia means a temporal lobe; homonymous hemianopia with macular sparing means the back of the head. The patient describes the territory; you name the post code.',
      ],
      demos: [
        { preset: 'chiasmalCompression', watch: 'visual field' },
        { preset: 'meyersLoopLeft', watch: 'visual field' },
        { preset: 'occipitalInfarctRight', watch: 'visual field' },
      ],
    },
  ],
};
