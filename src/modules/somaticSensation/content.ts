import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { SomaticPresetName } from './engine/presets';

export const somaticSensationContent: ExplainerContent<SomaticPresetName> = {
  title: 'One gate decides what you feel, and two crossing tracts decide where you lose it',
  sections: [
    {
      heading: 'Pain is an output of the dorsal horn, not a line to the brain',
      paragraphs: [
        'Pain is not a line from the injury to the brain; it is an output of the dorsal horn that can be opened and closed before it ever ascends. The gate: nociceptive C-fibre traffic opens transmission cells to projection, while large Aβ touch fibres, rubbing counterstimulus, descending modulation from the midbrain, and opioid action all close it. This is why rubbing a fresh bump genuinely helps, why distraction works, and why opioids act at both cord and brainstem. Load the burn preset, then rub the area — watch the gate readout close and the pain score fall with nothing else changed about the injury at all.',
      ],
      demos: [
        { preset: 'normal', watch: 'pain' },
        { preset: 'acuteBurn', watch: 'pain' },
      ],
    },
    {
      heading: 'Latency tells you which fibres are carrying what',
      paragraphs: [
        'Latency tells you which fibres are carrying what. Over a limb length, Aδ fibres deliver sharp first pain in under a tenth of a second; unmyelinated C fibres deliver the slow burning second pain more than a second later. The same ordering governs drug blocks: local anaesthetics silence small nociceptive fibres long before thick Aβ touch fibres, which is why a dental patient feels pressure but not the drill. Run the block preset — pain traffic gone, touch traffic largely intact. That differential is also why spinal anaesthesia takes away pain and temperature before it takes away proprioception.',
      ],
      demos: [
        { preset: 'laBlock', watch: 'first pain' },
      ],
    },
    {
      heading: 'Sensitisation inverts the system entirely',
      paragraphs: [
        'Then sensitisation inverts the system entirely. Inflammatory mediators lower thresholds in the periphery while sustained C-input recruits NMDA-dependent amplification centrally (wind-up). Once sensitised, Aβ traffic itself begins to drive pain pathways — light touch hurts. That is allodynia, and it separates neuropathic states from simple nociception: the stimulus is innocent, the machinery is not. On the neuropathic preset, raise the touch slider alone and watch the pain score climb with the nociceptors essentially silent.',
      ],
      demos: [
        { preset: 'neuropathicAllodynia', watch: 'pain' },
      ],
    },
    {
      heading: 'The ascending anatomy explains every dissociated loss',
      paragraphs: [
        'The ascending anatomy then explains every dissociated sensory loss examiners ask for. Dorsal columns carry touch and proprioception UP the same side, crossing in the medulla; spinothalamic fibres cross within a segment or two of entering and ascend on the opposite side. A hemisection therefore takes touch below on its own side but pain on the other — Brown-Séquard, the classic dissociation. Load it: left body loses left touch, right body loses right pain, from one knife.',
      ],
      demos: [
        { preset: 'brownSequardLeft', watch: 'dissociated loss' },
      ],
    },
    {
      heading: 'The other tract patterns follow the same logic',
      paragraphs: [
        'The other tract patterns follow the same logic. Anterior-quadrant damage takes both spinothalamics — lost pain and temperature below with dorsal columns spared, the anterior cord syndrome of an infarct or flexion injury, with corticospinal tracts travelling alongside. A syrinx expanding from the central canal interrupts pain fibres exactly where they cross in front of it, producing a cape-like segmental loss of pain and temperature with everything below intact and columns untouched — the reason these patients burn their hands without noticing. Complete transection spares nothing. Learn the crossings and every pattern derives itself; memorise the list instead and they blur together.',
      ],
      demos: [
        { preset: 'anteriorCord', watch: 'dissociated loss' },
        { preset: 'syringomyelia', watch: 'dissociated loss' },
        { preset: 'completeTransection', watch: 'dissociated loss' },
      ],
    },
  ],
};
