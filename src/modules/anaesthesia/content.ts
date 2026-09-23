import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { AnaesthesiaPresetName } from './engine/presets';

export const anaesthesiaContent: ExplainerContent<AnaesthesiaPresetName> = {
  title: 'Anaesthetic uptake is a solubility race',
  sections: [
    {
      heading: 'Every dial setting passes through the circuit first',
      paragraphs: [
        'The vaporizer number is a promise, not a fact. Between the dial and the alveoli sit the bag, the hoses and the absorber, and the fresh gas that must sweep them all: a circuit of several litres is only replaced at the rate the fresh gas flow enters it, so at a low flow the dialed concentration takes minutes to appear at the Y-piece and hours of it never do. This module draws that wash-in so the learner can watch a 5% dial become a 1% patient, not because the machine is broken but because concentration is carried by volume over time like everything else in this specialty.',
      ],
      demos: [
        { preset: 'sevofluraneInduction', watch: 'Inspired fraction' },
      ],
    },
    {
      heading: 'The blood is a sink, and lambda sets its size',
      paragraphs: [
        'Whatever reaches the alveoli is immediately met by blood: the more soluble the agent, the more of it the blood takes and the slower the alveolar level climbs toward the dial. The blood:gas partition coefficient is a number the anaesthetist carries for exactly four drugs — desflurane barely dissolves, halothane dissolves far more — and it is the whole reason a halothane induction is a slow grind while a sevoflurane one slips away. Set the solubility slider and watch the same curve flatten: the sink fills, and the time-to-90% clock doubles and trebles.',
      ],
      demos: [
        { preset: 'halothaneSlowWashin', watch: 'Minutes to 90%' },
      ],
    },
    {
      heading: 'Cardiac output decides how fast the sink refills',
      paragraphs: [
        'Solubility sets the size of the sink; cardiac output sets how quickly it refills. A high-output patient strips agent from the circuit faster and charges the effect site sooner, which is why the same vaporizer setting reads differently in a septic patient and an athlete, and why anaesthetists push the dial ahead of the measured depth. Raise the cardiac output here and the absorption index climbs while the minutes-to-90% falls — the same dose goes further into the body and reaches the brain earlier, and the arithmetic of "keep ahead of the output" becomes visible.',
      ],
      demos: [
        { preset: 'highCardiacOutput', watch: 'Agent absorption' },
      ],
    },
    {
      heading: 'Low flow lets the patient rebreathe the dial down',
      paragraphs: [
        'Fresh gas flow is the anaesthetist\'s cheapest lever and the least understood. At six to ten litres a minute the circuit behaves as if it were open to the dial; the moment it falls to one or two litres, rebreathing returns previously breathed gas to the patient and quietly divides the delivered concentration by a factor of three or four. The inspired fraction reading on this module is exactly that dilution. Learners pick up the low-flow preset and see, without any math, why "two percent on the dial" is a lie when the flow is a trickle.',
      ],
      demos: [
        { preset: 'lowFlowRebreathing', watch: 'Wash-in progress' },
      ],
    },
    {
      heading: 'The effect site follows last of all',
      paragraphs: [
        'The brain is downstream of the lungs, so the patient is not asleep when the monitor says the alveolar level has arrived — they are asleep when the effect site catches up, and the lag is governed by the same solubility. Halothane\'s sluggish wash-in means its effect site dawdles even longer; desflurane\'s near-instant lung loading is followed almost immediately by a near-instant brain. This is the practical meaning of the blood:brain partition: induction speed is never read off the vaporizer, it is read off the gap between the two curves this picture draws.',
      ],
      demos: [
        { preset: 'desfluraneRapidWashin', watch: 'Effect-site (brain)' },
      ],
    },
    {
      heading: 'Wash-out is the same curve falling backwards',
      paragraphs: [
        'Turn the dial to zero and nothing is destroyed, only diluted: fresh gas sweeps the circuit, the blood returns agent to the lungs, and the alveolar level falls along the same exponential the rise used, only inverted. That is emergence, and the recovery room is a race between the agent leaving the blood and the surgical stimulus arriving. The emergence preset lets a learner watch the wash-out curve at high flow — and then set a low flow to see how much longer the waking takes, which is why the flush valve is a knob, not a hope.',
      ],
      demos: [
        { preset: 'emergenceWashout', watch: 'Alveolar concentration' },
      ],
    },
    {
      heading: 'What the readouts are telling you',
      paragraphs: [
        'The six tiles are the six numbers a real anaesthetist is effectively keeping track of: the alveolar level the monitor prints, the effect-site level that is actually doing the anaesthesia, the inspired fraction the circuit is really delivering, the wash-in progress (how far along the curve the patient is), the minutes-to-90% that says whether this agent and this flow are fast or slow, and the absorption index that prices the whole transaction in agent taken up. Together they turn "slow induction" from a vibe into a number that moves when you change one thing.',
      ],
    },
  ],
};