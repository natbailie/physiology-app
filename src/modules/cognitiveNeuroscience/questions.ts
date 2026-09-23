import type { ModuleQuestion } from '@/shared/assessment/types';
import type { CognitionPresetName } from './engine/presets';
import type { CognitionDerived, CognitionInputs, CognitionInternalState } from './engine/types';

// The engine's real state, not `unknown`. The test file declares a `Snapshot` of its own with
// the same name and the concrete type, and the two silently disagreeing is what made every
// `perturb` here incompatible with the harness that runs it.
type Snapshot = { state: CognitionInternalState; derived: CognitionDerived };

const performance = (s: Snapshot): number => s.derived.performancePct;
const effort = (s: Snapshot): number => s.derived.effortActivePct;
const occupancy = (s: Snapshot): number => s.derived.memoryOccupancyPct;

export const COGNITION_QUESTIONS: ModuleQuestion<CognitionInputs, CognitionPresetName, Snapshot>[] = [
  {
    id: 'predict-demand-overloads-performance',
    stem: 'A student cruising comfortably — low distraction, a three-chunk load, moderate arousal — is told to add a demanding write-up on top of the coursework. Settle the baseline, then dial the task demand right up and predict what happens to the performance index.',
    setup: {},
    intervention: { label: 'Raise the task demand', inputs: { cognitiveDemandPct: 85 } },
    prompt: 'What happens to the performance index?',
    watch: 'Performance index',
    correctDirection: 'falls',
    metric: performance,
    explanation:
      'Performance falls sharply because a harder task relocates the arousal optimum down the axis: the optimum for demand 85 sits at an arousal of around 14, and the student\'s calm 45% is now on the far shoulder of a curve that moved away from them. The same arousal that was near-peak for an easy problem is now wrong for a hard one — the literal meaning of "the task decides the optimum". The demand also overshoots the reserve, so the index roughly halves while the effort bar climbs. A learner doing fine can look suddenly worse when the work hardens precisely because the peak moved.',
  },
  {
    id: 'predict-arousal-peaks-then-falls',
    stem: 'An easy, familiar task is attempted at a comfortable arousal. Then the learner is told the task somehow counts and their arousal spikes upward. Predict what happens to the performance index of that easy task.',
    setup: { inputs: { cognitiveDemandPct: 15 } },
    intervention: { label: 'Spike the arousal', inputs: { baselineArousalPct: 92 } },
    prompt: 'What happens to the performance index?',
    watch: 'Performance index',
    correctDirection: 'falls',
    metric: performance,
    explanation:
      'Performance collapses even though the task did not get harder, because the inverted-U cuts both sides of the peak. For an easy problem the optimum sits around forty percent arousal, and ninety-two percent is so far over it that the curve has reached the floor — the cascade of a choke. The arousal-optimality tile drops toward zero, and the effort it buys falls too, because effort far from the optimum is moot and the reserve never opens. Easy task, wrong arousal, catastrophic grade: the module\'s clearest proof that arousal is a dial to set, not a level to maximise.',
  },
  {
    id: 'predict-fatigue-spends-effort',
    stem: 'A well-rested student with a manageable task and moderate arousal has effort flowing freely. A week of short nights then raises fatigue sharply. Predict what happens to deployed effort.',
    setup: {},
    intervention: { label: 'Raise fatigue', inputs: { fatiguePct: 85 } },
    prompt: 'What happens to deployed effort?',
    watch: 'Deployed effort',
    correctDirection: 'falls',
    metric: effort,
    explanation:
      'Deployed effort collapses even at the same task, because fatigue withdraws from the executive reserve itself rather than making the work feel heavier: every unit of fatigue cuts the reserve that effort can draw on, and at fatigue around 85 the reserve door is effectively shut, leaving barely enough effort to start, let alone persist. This is the physiology behind "I wanted to work and could not" — motivation stayed intact while the reserve stopped paying out. The fatigue slider and the reserve meter are the same story read twice: one sets the price, the other the availability.',
  },
  {
    id: 'predict-distraction-fills-the-rack',
    stem: 'A learner holds a three-chunk lesson with light distraction, occupancy comfortably inside the 7±2 ceiling. A phone starts ringing on the desk, raising distraction sharply. Predict what happens to working-memory occupancy.',
    setup: {},
    intervention: { label: 'Raise distraction', inputs: { distractionLevelPct: 80 } },
    prompt: 'What happens to working-memory occupancy?',
    watch: 'Working memory occupancy',
    correctDirection: 'rises',
    metric: occupancy,
    explanation:
      'Occupancy rises without a single extra chunk of content, because distraction consumes capacity: the 7±2 rack is a fixed size, and the noise occupies part of it while the lesson still demands its own share. The rack fills towards the cliff even though the learner tried to hold nothing more, which is the mechanism that lets one notification derail reasoning that would otherwise fit. The number worth watching is not the distraction slider but the occupancy it buys — mental noise is expensive.',
  },
  {
    id: 'predict-load-fills-the-rack',
    stem: 'A learner holds a comfortable three-chunk lesson. Without any other change, the lesson now demands seven chunks. Predict what happens to working-memory occupancy.',
    setup: {},
    intervention: { label: 'Raise the memory load', inputs: { memoryLoad: 7 } },
    prompt: 'What happens to working-memory occupancy?',
    watch: 'Working memory occupancy',
    correctDirection: 'rises',
    metric: occupancy,
    explanation:
      'Occupancy climbs toward the ceiling because the 7±2 rack has no elasticity: seven chunks is the maximum headroom was built for, and even modest background friction pushes the fill past the margin where there is still slack to think. The metric that matters is occupancy rather than load, because it packages load AND the friction stealing from it into one reading — "too much to hold" and "too noisy to hold it" resolve to the same number.',
  },
  {
    id: 'predict-reserve-caps-effort',
    stem: 'A learner sits at elevated arousal on a demanding task, where the effort account is doing most of the work. Their executive reserve is then drawn down to five percent. Predict what happens to deployed effort.',
    setup: { inputs: { baselineArousalPct: 70, cognitiveDemandPct: 60 } },
    intervention: { label: 'Draw down the reserve', inputs: { executiveReservePct: 5 } },
    prompt: 'What happens to deployed effort?',
    watch: 'Deployed effort',
    correctDirection: 'falls',
    metric: effort,
    explanation:
      'Effort falls because effort is meted out from the reserve, and the reserve is what is gone. At an arousal far from the task optimum the reserve is already the main thing keeping effort alive, so cutting it from eighteen to five percent collapses what the learner can mount. This is the mechanism that makes "giving up" physiological rather than moral: the capacity to persist is a resource with a balance, and this scenario has spent it.',
  },
  {
    id: 'predict-hard-task-arouses-the-choke',
    stem: 'A learner on a moderately hard task is already somewhat elevated in arousal; both the task sharpness and their arousal are then pushed up together. Predict what happens to the performance index.',
    setup: { inputs: { cognitiveDemandPct: 45, baselineArousalPct: 55 } },
    intervention: { label: 'Harden the task and raise arousal', inputs: { cognitiveDemandPct: 88, baselineArousalPct: 92 } },
    prompt: 'What happens to the performance index?',
    watch: 'Performance index',
    correctDirection: 'falls',
    metric: performance,
    explanation:
      'The performance index crashes to its floor, and the reason is the multiplication rather than either knob alone. Hardening the task dragged the optimum down to roughly fourteen percent arousal while raising arousal to ninety-two dragged the learner to the opposite shoulder — together they land an enormous distance from the peak, which is the very definition of choking under pressure. Difficulty and arousal are not independent dials to tune: the task moves the target and the arousal moves the arrow, and when both go the wrong way the outcome is worse than the sum of their individual costs.',
  },
  {
    id: 'pattern-which-one-is-overwhelmed',
    stem: 'Four scenarios settle at their own baselines — a relaxed learner, a high-stakes exam, a sleep-deprived student and a full panic attack. The panels below read the same four instruments for each. Which one is unmistakably overwhelmed, with demand pushing past the reserve line?',
    answer: 'panicAttack',
    options: ['examStress', 'panicAttack', 'sleepDeprived', 'relaxedLearning'],
    panel: [
      { label: 'Demand overshoot', value: (s) => s.derived.demandOvershootPct },
      { label: 'Working memory occupancy', value: (s) => s.derived.memoryOccupancyPct },
      { label: 'Arousal optimality', value: (s) => s.derived.arousalOptimality * 100 },
      { label: 'Deployed effort', value: (s) => s.derived.effortActivePct },
    ],
    explanation:
      'The panic attack is the one whose demand overshoot crosses the cliff. At arousal 95 the task optimum has receded toward 14 and the reserve is nearly shut, so effort is near zero while demand still runs at 90 — the demand-overshoot tile and the red segment beyond the reserve line are the distinguishing signal. The exam stress is also over-aroused but its overshoot stays below the cliff (near 23% rather than 34%), so it mostly chokes rather than plainly overwhelms; the sleep-deprived and relaxed scenarios never leave the reserve line at all. "Overwhelmed" is a demand-versus-reserve comparison, not an emotional adjective.',
  },
  {
    id: 'pattern-which-one-is-choking',
    stem: 'Four scenarios settle — an exam, a full panic attack, a distracted classroom and a learner in the zone. The panels read the same instruments. Which one is over-aroused but not yet overwhelmed: arousal way off the task\'s optimum while the reserve line still holds?',
    answer: 'examStress',
    options: ['examStress', 'panicAttack', 'distractedClassroom', 'inTheZone'],
    panel: [
      { label: 'Demand overshoot', value: (s) => s.derived.demandOvershootPct },
      { label: 'Deployed effort', value: (s) => s.derived.effortActivePct },
      { label: 'Arousal optimality', value: (s) => s.derived.arousalOptimality * 100 },
      { label: 'Performance index', value: (s) => s.derived.performancePct },
    ],
    explanation:
      'The exam stress is the picture of choking: its arousal optimality has fallen to zero — arousal near 80 against a task optimum of around 16 — yet its demand overshoot stays just below the cliff, so it is not yet overwhelmed, merely performing terribly. The panic scenario has already crossed the cliff (overshoot 34% and almost no effort left), while the distracted classroom and the zone both sit near their own task optimums and the zone rides the top of the curve. Choking and overwhelming are adjacent on the same axis, and these two scenarios mark the boundary between them.',
  },
];