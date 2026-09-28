import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { KrebsCyclePresetName } from './engine/presets';

export const krebsCycleContent: ExplainerContent<KrebsCyclePresetName> = {
  title: 'Why demand pulls the Krebs cycle and oxygen decides what it makes',
  sections: [
    {
      heading: 'One throughput — substrate offered, oxygen accepted, demand pulling',
      paragraphs: [
        'Every number in this module hangs off a single throughput: acetyl-CoA offered to citrate synthase, oxygen available to accept the electrons at the far end of the chain, and ADP with calcium demanding the turnover in between. Carbohydrate arrives through the pyruvate dehydrogenase gate and fat through beta-oxidation, and the two entries are drawn as arrows whose calibre is the flux — because the first thing a learner must see is that the cycle has doors, and that each door has its own key. Thiamine is the cofactor key for two of the three NADH-making steps, oxygen is the terminal key for all of them, and demand is the hand turning the handle. The multiplicative shape is the point: a single choked factor stalls the whole throughput rather than shaving a polite percentage off it, which is why mitochondrial failure arrives as a threshold event.',
      ],
      demos: [
        { preset: 'exercise', watch: 'cycle flux' },
        { preset: 'fastedFat', watch: 'respiratory quotient' },
      ],
    },
    {
      heading: 'While air keeps up, exercise is answered with flux rather than lactate',
      paragraphs: [
        'Raise demand with oxygen intact and the cycle simply turns faster: flux more than doubles, oxygen consumption follows, ATP yield climbs, and lactate stays flat under two. That flat lactate is the half of exercise physiology most learners get backwards — the assumption is that harder work must mean more lactate, when at steady state below the threshold the mitochondrion clears pyruvate as fast as glycolysis makes it. The tempo-run preset exists to plant exactly this observation before the sprint preset overturns it, because the anaerobic threshold is meaningless as a number until the aerobic capacity beneath it has been watched working. Read the flux meter against the lactate meter as a pair and the module has taught the single most examined distinction in exercise biochemistry.',
      ],
      demos: [
        { preset: 'exercise', watch: 'lactate' },
        { preset: 'anaerobicThreshold', watch: 'lactate' },
      ],
    },
    {
      heading: 'When oxygen cannot take electrons, the turns stall and pyruvate spills',
      paragraphs: [
        'Drop oxygen to mountain-emergency levels and the same resting demand now produces a lactic acidosis: flux collapses to a fifth, ATP follows it down, and lactate climbs past eight because pyruvate denied the PDH gate is reduced to lactate instead. The mechanism is worth stating precisely, since examinations reward it: without oxygen the chain cannot re-oxidise NADH, without NAD+ the three dehydrogenases cannot run, and without the turns there is nowhere for pyruvate to go but the spillway. The sprint preset shows the same spill from the other direction — demand outpacing delivery rather than delivery failing at rest — which is why threshold physiology and altitude physiology share a lactate while differing in every other tile, and why the state line distinguishes oxygen-limited from high demand even when the lactate numbers rhyme.',
      ],
      demos: [
        { preset: 'hypoxia', watch: 'lactate' },
        { preset: 'hypoxia', watch: 'cycle flux' },
      ],
    },
    {
      heading: 'Cofactors and gates choke carbohydrate while fat keeps burning',
      paragraphs: [
        'Thiamine deficiency and PDH defects injure the same door from different sides — one removes the cofactor two key steps need, the other welds the gate itself — and both spill lactate while leaving fatty-acid entry untouched. The quotient is what tells the story the lactate cannot: with carbohydrate denied and fat still feeding the turns, the RQ slides from the mixed eighties toward the fat seventies, the opposite direction to a sprint. That dissociation is the beri-beri and PDH-deficiency fingerprint, and it is why the module draws the two entries as separate arrows rather than one substrate slider: a single fuel control could never show carbohydrate failing while fat succeeds. The inherited gate that will not open is also the reason some lactic acidoses ignore oxygen entirely, which reframes the reflex to reach for the oxygen mask.',
      ],
      demos: [
        { preset: 'thiamineDeficiency', watch: 'lactate' },
        { preset: 'pdhDeficiency', watch: 'respiratory quotient' },
      ],
    },
    {
      heading: 'The quotient reads the fuel shares the gases cannot name',
      paragraphs: [
        'The respiratory quotient is the fuel mix read by a spirometer: pure carbohydrate burns at unity, pure fat near seven tenths, and the fasted high-fat preset lands at about three quarters with lactate as flat as rest. That flat lactate beside a shifted quotient is deliberately the mirror image of the sprint — quotient moved with lactate flat versus lactate moved with quotient steady — and the pair together exhaust what the gas tiles can say. A learner who can hold both patterns apart understands that RQ answers which fuel while lactate answers whether the gate kept up, which are different questions asked of the same mitochondrion. Drag the substrate sliders at constant demand and watch the quotient slide while flux barely moves: admission is not throughput, and the cycle burns what it is given only once demand asks it to.',
      ],
      demos: [
        { preset: 'fastedFat', watch: 'respiratory quotient' },
      ],
    },
    {
      heading: 'Three-two-one-two is the stoichiometry every tile obeys',
      paragraphs: [
        'Each acetyl-CoA turn releases three NADH, one FADH2, one GTP and two carbon dioxides, with one further NADH at the PDH step per pyruvate — the Lehninger sentence the analytic tests hold the engine to for arbitrary flux. Those ratios are identities rather than calibrations, which is why the meter frame can be read as bookkeeping rather than behaviour: double the turns and every product doubles with them, whatever the demand, the oxygen or the fuel that drove the doubling. The ATP tile then cashes the equivalents at the textbook phosphate-to-oxygen ratios, two and a half per NADH and one and a half per FADH2, so the energy the module reports is the chain output rather than a second model of it. Follow the fumarate arrow out of the urea cycle module and back here, and the bicycle is complete: nitrogen disposal donating carbon to burn, and the burn returning the aspartate nitrogen disposal spends.',
      ],
      demos: [
        { preset: 'exercise', watch: 'ATP yield' },
      ],
    },
  ],
};
