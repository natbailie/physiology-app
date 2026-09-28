import type { ModuleQuestion } from '@/shared/assessment/types';
import type { KrebsCycleDerived, KrebsCycleInputs, KrebsCycleInternalState } from './engine/types';
import type { KrebsCyclePresetName } from './engine/presets';

type Snapshot = { state: KrebsCycleInternalState; derived: KrebsCycleDerived };
export type KrebsCycleQuestion = ModuleQuestion<KrebsCycleInputs, KrebsCyclePresetName, Snapshot>;

export const KREBS_CYCLE_QUESTIONS: readonly KrebsCycleQuestion[] = [
  {
    id: 'exercise-raises-flux',
    stem: 'A cyclist settles into a tempo effort well within her aerobic capacity. Her breathing rises to meet demand and her legs feel sustainable.',
    setup: { preset: 'normal' },
    intervention: { label: 'She lifts demand to a tempo effort.', inputs: { atpDemandMet: 5 } },
    prompt: 'What happens to her cycle flux?',
    watch: 'cycle flux',
    correctDirection: 'rises',
    explanation:
      'Flux more than doubles, because demand pulls: ADP and calcium drive the dehydrogenases faster and the turns follow, with oxygen consumption and ATP yield climbing alongside. This is the normal answer to work — the mitochondrion meeting demand by turning faster rather than by changing chemistry. The companion question showing lactate flat through the same intervention is the other half of the lesson, and the pair together define what aerobic even means: throughput up, spillway dry.',
    metric: (s) => s.derived.tcaFlux,
  },
  {
    id: 'exercise-leaves-lactate-flat',
    stem: 'The same cyclist holds the tempo effort for an hour. Her breathing is steady and she could speak in short sentences throughout.',
    setup: { preset: 'normal' },
    intervention: { label: 'She lifts demand to a tempo effort.', inputs: { atpDemandMet: 5 } },
    prompt: 'What happens to her plasma lactate?',
    watch: 'lactate',
    correctDirection: 'unchanged',
    explanation:
      'It barely moves, because below the threshold the mitochondrion clears pyruvate as fast as glycolysis makes it — harder work does not mean more lactate until delivery fails to keep up. The instinct that effort must acidify is the single commonest error in exercise biochemistry, and this flat line is its correction. Lactate is not a tachometer of work but a spillway reading, and a dry spillway beside a doubled flux is exactly what aerobic fitness looks like from inside the mitochondrion.',
    metric: (s) => s.derived.lactateMmolL,
    tolerance: 0.05,
  },
  {
    id: 'sprint-outpaces-delivery',
    stem: 'The cyclist attacks on a climb, demanding far more than her delivery can supply. Her oxygen availability to the muscle effectively sags.',
    setup: { preset: 'exercise' },
    intervention: { label: 'She sprints beyond what delivery supplies.', inputs: { atpDemandMet: 6, oxygenPct: 60 } },
    prompt: 'What happens to her plasma lactate?',
    watch: 'lactate',
    correctDirection: 'rises',
    explanation:
      'Lactate climbs severalfold into the acidotic range, because demand now outpaces the electrons the chain can accept: the turns cannot run without NAD+, and pyruvate with nowhere to go is reduced to lactate instead. This is the threshold crossed — the same demand axis that was harmless at full delivery becomes acidotic the moment delivery sags. The teaching value is entirely comparative: tempo and sprint differ not in effort but in whether the air kept up, which is why threshold physiology and altitude physiology share a lactate while differing everywhere else.',
    metric: (s) => s.derived.lactateMmolL,
  },
  {
    id: 'hypoxia-stalls-the-turns',
    stem: 'A climber rests at extreme altitude with very little oxygen reaching his mitochondria. His energy demand is ordinary resting demand.',
    setup: { preset: 'normal' },
    intervention: { label: 'Oxygen availability falls to a sixth.', inputs: { oxygenPct: 15 } },
    prompt: 'What happens to his cycle flux?',
    watch: 'cycle flux',
    correctDirection: 'falls',
    explanation:
      'Flux collapses to a fifth of baseline, because without oxygen the chain cannot re-oxidise NADH and without NAD+ the dehydrogenases cannot run — a single choked factor stalling the whole throughput rather than shaving a percentage off it. The multiplicative shape is the point the module keeps insisting on: mitochondrial failure arrives as a threshold event, which is why altitude collapse looks sudden rather than graded. ATP follows flux down, and the energy failure rather than the lactate is what actually threatens the climber first.',
    metric: (s) => s.derived.tcaFlux,
  },
  {
    id: 'hypoxia-spills-lactate-at-rest',
    stem: 'The same resting climber has bloods drawn at altitude. He has done no exercise at all.',
    setup: { preset: 'normal' },
    intervention: { label: 'Oxygen availability falls to a sixth.', inputs: { oxygenPct: 15 } },
    prompt: 'What happens to his plasma lactate?',
    watch: 'lactate',
    correctDirection: 'rises',
    explanation:
      'Lactate climbs past eight at complete rest, which overturns the effort-equals-lactate instinct more cleanly than any sprint could: the spillway reads the gate, not the workload. Pyruvate denied the PDH gate by an oxidised-chain traffic jam has exactly one alternative, and the resting demand supplies the pyruvate. This is why a resting lactate belongs in the assessment of shock, hypoxia and mitochondrial disease rather than only in sports science, and why the module draws the spillway as a permanent structure rather than an exercise accessory.',
    metric: (s) => s.derived.lactateMmolL,
  },
  {
    id: 'thiamine-starves-two-steps',
    stem: 'A malnourished man dependent on alcohol presents confused with a lactic acidosis. His thiamine stores are nearly exhausted, starving PDH and alpha-ketoglutarate dehydrogenase of TPP.',
    setup: { preset: 'normal' },
    intervention: { label: 'Thiamine status collapses.', inputs: { thiaminePct: 10 } },
    prompt: 'What happens to his plasma lactate?',
    watch: 'lactate',
    correctDirection: 'rises',
    explanation:
      'Lactate climbs past four with oxygen delivery completely normal, because the block is at the gate rather than at the sink: pyruvate cannot enter regardless of how much air is offered. This is the cofactor lesson in its purest form, and the reason some lactic acidoses ignore the oxygen mask — the reflex to increase delivery treats a door problem as a chimney problem. Intravenous thiamine reverses in hours what fluids and oxygen never touched, which is why every confused alcoholic with an acidosis receives it before the laboratory confirms anything.',
    metric: (s) => s.derived.lactateMmolL,
  },
  {
    id: 'fat-diet-slides-the-quotient',
    stem: 'A volunteer eats no carbohydrate for several days, running entirely on fat stores and a ketogenic intake. Her demand and oxygen are ordinary.',
    setup: { preset: 'normal' },
    intervention: { label: 'She switches to fat-only substrate.', inputs: { glucoseSupplyPct: 15, fattyAcidSupplyPct: 90 } },
    prompt: 'What happens to her respiratory quotient?',
    watch: 'respiratory quotient',
    correctDirection: 'falls',
    explanation:
      'The quotient slides from the mixed eighties toward the fat seventies, because fat oxidation releases less carbon per oxygen consumed and the spirometer reads the fuel shares directly. Lactate stays flat throughout — the mirror image of the sprint, where lactate moved with the quotient steady — and the pair together exhaust what the gas tiles can say. Admission is not throughput either: the quotient moves while flux barely changes, since the cycle burns what it is given only once demand asks it to, which reframes every argument about diets as arguments about doors rather than engines.',
    metric: (s) => s.derived.rqProxy,
  },
  {
    id: 'the-resting-acidosis',
    stem: 'A resting patient is acidotic with a lactate over eight. His oxygen consumption is very low and his quotient is unremarkable.',
    answer: 'hypoxia',
    options: ['normal', 'exercise', 'hypoxia', 'thiamineDeficiency'],
    panel: [
      { label: 'Lactate', value: (s) => s.derived.lactateMmolL, unit: 'mmol/L', decimals: 1 },
      { label: 'RQ', value: (s) => s.derived.rqProxy, decimals: 2 },
      { label: 'ATP yield', value: (s) => s.derived.atpYield, decimals: 1 },
    ],
    explanation:
      'Sky-high lactate at rest with collapsed ATP and an ordinary quotient is the sink failing, not the door: the chain cannot take electrons, so the turns stall whatever the fuel. Exercise shares nothing but the demand axis — its lactate is flat and its ATP high — while thiamine deficiency shares the lactate but keeps far more ATP and slides the quotient down. Reading all three rows is what separates a chimney problem from a door problem, and that separation decides between oxygen and thiamine as the treatment.',
  },
  {
    id: 'the-door-not-the-chimney',
    stem: 'A patient carries a moderate lactic acidosis with a low quotient and middling ATP. Oxygen delivery is documented as normal.',
    answer: 'thiamineDeficiency',
    options: ['normal', 'thiamineDeficiency', 'pdhDeficiency', 'fastedFat'],
    panel: [
      { label: 'Lactate', value: (s) => s.derived.lactateMmolL, unit: 'mmol/L', decimals: 1 },
      { label: 'RQ', value: (s) => s.derived.rqProxy, decimals: 2 },
      { label: 'ATP yield', value: (s) => s.derived.atpYield, decimals: 1 },
    ],
    explanation:
      'Lactate up with the quotient down and oxygen normal is carbohydrate denied entry while fat keeps burning — the cofactor fingerprint. The PDH defect is the near neighbour and the genuinely hard distinction, running hotter lactate with better-kept ATP through the same denied door, while the fasted volunteer shares the low quotient with a flat lactate and no acidosis at all. The quotient row is what rules the fasted state in or out, and the ATP row is what separates two broken doors from each other.',
  },
];
