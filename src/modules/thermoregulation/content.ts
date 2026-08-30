import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { ThermoPresetName } from './engine/presets';

export const thermoregulationContent: ExplainerContent<ThermoPresetName> = {
  title: 'Fever is defended and hyperthermia is overwhelmed — the set point tells you which',
  sections: [
    {
      heading: 'Heat balance is a single ledger, in and out',
      paragraphs: [
        'Heat balance is a single ledger. In come metabolic production — eighty-odd watts at rest, multiplied several-fold by exercise or shivering — plus any environmental gain when the air is hotter than skin. Out goes dry loss (radiation and convection down a skin-to-air gradient) and evaporation, whose ceiling is set by how much water vapour the air can still accept. Core temperature simply integrates that ledger through the body\'s thermal mass. Watch what humid heat does: sweat keeps flowing but nothing evaporates, so the cooling arm of the ledger fails while production continues — which is why damp tropical heat kills where dry desert heat of the same temperature often does not.',
      ],
      demos: [
        { preset: 'normothermic', watch: 'core temperature' },
      ],
    },
    {
      heading: 'The hypothalamus defends a set point and every effector obeys',
      paragraphs: [
        'The hypothalamus defends a set point, and every effector answers to it. Below the point the body vasoconstricts, then shivers — up to four hundred watts of involuntary production. Above it, skin flow rises as much as five-fold and sweating engages, the only loss mechanism that can exceed basal metabolism. The defences are hierarchical and fail in order: in deep hypothermia shivering itself falls silent below about 32 degrees, a sign that matters more than any number on a chart, because it means the machinery of defence is shutting down rather than merely losing.',
      ],
    },
    {
      heading: 'Fever is not overheating, it is a raised target',
      paragraphs: [
        'Fever is not overheating; it is a raised target. Pyrogens drive prostaglandin signalling in the hypothalamus and move the set point up, after which the body pursues the new point with its ordinary tools — vasoconstriction and rigors while climbing, which is exactly why a burning patient feels cold under blankets. This is also why antipyretics work the way they do: paracetamol blocks the prostaglandin step and lowers the point, never the infection. Give one during a rising fever and watch the sequence on screen: set point drops below core, sweating begins, temperature falls — the "crisis" of pre-modern medicine, now just pharmacology.',
      ],
      demos: [
        { preset: 'feverViral', watch: 'set point' },
        { preset: 'feverOnAntipyretic', watch: 'set point' },
      ],
    },
    {
      heading: 'Hyperthermia inverts every part of that picture',
      paragraphs: [
        'Hyperthermia inverts every part of that picture. The set point has not moved; heat production (exercise), failed evaporation (humidity, anticholinergics, malignant hyperthermia), or both overwhelm the same defences. The patient is hot and BEHAVING hot — sweaty until sweating fails, then hot and dry as disaster approaches. Exertional heat stroke sits at the intersection: nine-fold metabolic production in humid air with impaired sweating drives core past forty while the hypothalamus still defends thirty-seven. The treatments follow the distinction: cool hyperthermia aggressively, but never treat a defended fever as if it were a malfunction — the mechanisms overlap less than the numbers do.',
      ],
      demos: [
        { preset: 'heatStrokeExertional', watch: 'set point' },
      ],
    },
    {
      heading: 'Cold tells the same story with its own hierarchy of failure',
      paragraphs: [
        'Cold tells the same story in reverse, with its own hierarchy of failure. Mild hypothermia means maximal shivering still fighting; below 32 degrees the shiver itself fades — defences failing rather than succeeding — and confusion follows while the heart grows irritable, then quiet. Deep hypothermia suppresses heat production too, because cold tissue simply runs slowly, which is why rewarming must come from outside and why rough handling can tip a cold heart into fibrillation. Wind and wetness multiply loss far beyond what the thermometer alone suggests: set the wind-and-wet slider high and watch an identical air temperature become lethal.',
      ],
      demos: [
        { preset: 'mildHypothermia', watch: 'shivering' },
        { preset: 'deepHypothermia', watch: 'shivering' },
      ],
    },
  ],
};
