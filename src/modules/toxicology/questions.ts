import type { PredictQuestion, PatternQuestion } from '@/shared/assessment/types';
import type { ToxicologyPresetName } from './engine/presets';
import type { ToxicologyDerived, ToxicologyInputs } from './engine/types';

type Snapshot = { state: { simTimeSeconds: number; plasmaMgL: number }; derived: ToxicologyDerived };

const plasma = (s: Snapshot): number => s.derived.plasmaMgL;
const risk = (s: Snapshot): number => s.derived.hepatotoxicityRisk;
const absorbed = (s: Snapshot): number => s.derived.absorbedDoseMgPerKg;
const window = (s: Snapshot): number => s.derived.antidoteWindowHours;

export const TOXICOLOGY_QUESTIONS: (PredictQuestion<ToxicologyInputs, ToxicologyPresetName, Snapshot> | PatternQuestion<ToxicologyPresetName, Snapshot>)[] = [
  {
    id: 'overdose-raises-plasma',
    stem: 'A 16-year-old presents four hours after a reported intake. The nominal dose sits right on the 75 mg/kg treatment threshold.',
    setup: { preset: 'thresholdDose' },
    intervention: { label: 'The history doubles towards a real overdose: 300 mg/kg.',
      inputs: { doseMgKg: 300 } },
    prompt: 'What happens to the plasma paracetamol?',
    watch: 'Plasma paracetamol',
    correctDirection: 'rises',
    explanation:
      'The absorbed dose quadruples and the plasma follows it: more milligrams per kilogram sitting in the same litre-per-kg volume means a proportionally higher concentration at every hour. This is the step from "threshold" to "overdose" — the same clock, a much higher curve, and a point well above the treatment line rather than just under it. The nomogram is a concentration graph, so the dose is the height and the hour is the position.',
    metric: plasma,
  },
  {
    id: 'time-drains-plasma',
    stem: 'A large dose was swallowed ninety minutes ago and the first level is already circulating.',
    setup: { preset: 'earlyMassiveDose', inputs: { hoursSinceIngestion: 1.5 } },
    intervention: { label: 'The patient is re-bled as the ED clock ticks to eight hours.',
      inputs: { hoursSinceIngestion: 8 } },
    prompt: 'What happens to the plasma paracetamol over those hours?',
    watch: 'Plasma paracetamol',
    correctDirection: 'falls',
    explanation:
      'Absorption is treated as complete in the first half hour; after the peak the drug clears with a half-life of a few hours, so the concentration falls log-linearly whether or not anything is done. The same dose is "awful at hour two and reassuring at hour twelve" — which is the entire point of the nomogram. Danger is a position on a falling curve, not a fixed size of tablet.',
    metric: plasma,
  },
  {
    id: 'charcoal-sequesters-the-load',
    stem: 'An hour after a large ingestion, before any treatment, the load has not yet finished absorbing.',
    setup: { preset: 'earlyMassiveDose', inputs: { hoursSinceIngestion: 1, charcoalDosePct: 0 } },
    intervention: { label: 'Activated charcoal is given, capturing 40% of the load.',
      inputs: { charcoalDosePct: 40 } },
    prompt: 'What happens to the circulating paracetamol?',
    watch: 'Plasma paracetamol',
    correctDirection: 'falls',
    explanation:
      'Charcoal acts in the gut: it binds drug that has not yet reached the blood, and that captured share never appears in the plasma. Because it only works on the unabsorbed fraction, its value is destroyed by the hours — the same charcoal that cuts the plasma in quarter at one hour would change almost nothing at twelve. Do not read the fall as the liver clearing the drug; the liver has not done a thing.',
    metric: plasma,
  },
  {
    id: 'delaying-nac-raises-risk',
    stem: 'A large overdose arrives at four hours, still well above the treatment line.',
    setup: { preset: 'earlyMassiveDose', inputs: { hoursSinceIngestion: 4, doseMgKg: 400, nacStartHours: 4 } },
    intervention: { label: 'NAC is held until the twentieth hour.',
      inputs: { nacStartHours: 20 } },
    prompt: 'What happens to the hepatotoxicity risk?',
    watch: 'Hepatotoxicity risk',
    correctDirection: 'rises',
    explanation:
      'At four hours the NAC is already running and has stripped most of the risk from the presentation. Pushing the start to twenty hours leaves the patient above the line with the antidote still stopped — the risk meter jumps from a protected value to nearly the full untreated one. The model encodes the eight-hour window: early NAC removes most of the risk, delayed NAC removes little, and "I will start it soon" is not a thing the liver cares about.',
    metric: risk,
  },
  {
    id: 'early-nac-slams-the-risk',
    stem: 'A child presents two hours after 300 mg/kg, above the line and untreated.',
    setup: { preset: 'earlyMassiveDose', inputs: { hoursSinceIngestion: 2, doseMgKg: 300, nacStartHours: 99 } },
    intervention: { label: 'NAC is started immediately, inside the window.',
      inputs: { nacStartHours: 2 } },
    prompt: 'What happens to the hepatotoxicity risk?',
    watch: 'Hepatotoxicity risk',
    correctDirection: 'falls',
    explanation:
      'Start NAC inside eight hours and it removes most of the risk of the same presentation: the antidote steps in while the concentration is still high, and the curve never gets the uninterrupted hours at high concentration that damage hepatocytes. This is the outcome the whole module is training: the nomogram says the danger, NAC timing says whether the danger becomes damage. The same dose the moment it is treated reads dramatically safer.',
    metric: risk,
  },
  {
    id: 'window-closes-with-the-hours',
    stem: 'The nomogram looks fine at two hours, and the question is whether waiting is safe.',
    setup: { preset: 'thresholdDose', inputs: { hoursSinceIngestion: 2 } },
    intervention: { label: 'The patient is observed rather than treated.',
      inputs: { hoursSinceIngestion: 8 } },
    prompt: 'What happens to the remaining NAC window?',
    watch: 'Antidote window',
    correctDirection: 'falls',
    explanation:
      'The window is a countdown, not a reserve: it starts at eight hours and is simply spent by waiting. At hour eight it reads zero, and everything after that is treatment against an already-closed window. The engine tracks it as a quantity in hours, so the learner watches the protection tick away even while the plasma does the same—two clocks running in opposite directions that together say when the decision has to be made.',
    metric: window,
  },
  {
    id: 'crossing-the-threshold',
    stem: 'A "handful of tablets" history is walked up and up.',
    setup: { preset: 'safeExposure' },
    intervention: { label: 'The estimate is revised to exactly the 75 mg/kg threshold.',
      inputs: { doseMgKg: 75 } },
    prompt: 'What happens to the absorbed dose?',
    watch: 'Absorbed dose',
    correctDirection: 'rises',
    explanation:
      'The absorbed dose is dose minus whatever charcoal sequestered it; crossing 75 mg/kg is the line at which UK guidelines start NAC, whatever the plasma happens to read at the hour of measurement. Using the absorbed dose as the threshold reading keeps that rule in the learner\'s hands: below it, sub-toxic; above it, treatment is indicated even before the level comes back.',
    metric: absorbed,
  },
  {
    id: 'pattern-late-vs-just-now',
    stem: 'Which of these presentations is the one whose level has already fallen out of harm\'s way?',
    answer: 'latePresentation',
    options: ['latePresentation', 'missedWindow', 'thresholdDose', 'earlyMassiveDose'],
    panel: [
      { label: 'Hours since ingestion', value: (s) => s.derived.hoursSinceIngestion, unit: 'h', decimals: 0 },
      { label: 'Plasma paracetamol', value: (s) => s.derived.plasmaMgL, unit: 'mg/L', decimals: 0 },
      { label: 'Absorbed dose', value: (s) => s.derived.absorbedDoseMgPerKg, unit: 'mg/kg', decimals: 0 },
      { label: 'Antidote window', value: (s) => s.derived.antidoteWindowHours, unit: 'h', decimals: 0 },
    ],
    explanation:
      'The late presentation at sixteen hours has a plasma of barely 12 mg/L — far below its own treatment line, which has been falling alongside it. The lookalike presented a full day in, when the curve is essentially dead and the real story is that hepatic injury has already had its hours. The bulk of what discriminates is position on the curve, which is why the same "high-dose" history reads one way at sixteen hours and another at twenty-six.',
  },
  {
    id: 'pattern-which-is-still-above-line',
    stem: 'Two of these overdoses are high doses; which one is the untreated one still sitting above the treatment line?',
    answer: 'earlyMassiveDose',
    options: ['earlyMassiveDose', 'charcoalWins', 'safeExposure', 'latePresentation'],
    panel: [
      { label: 'Plasma paracetamol', value: (s) => s.derived.plasmaMgL, unit: 'mg/L', decimals: 0 },
      { label: 'Absorbed dose', value: (s) => s.derived.absorbedDoseMgPerKg, unit: 'mg/kg', decimals: 0 },
      { label: 'Charcoal uptake', value: (s) => s.derived.charcoalReductionPct, unit: '%', decimals: 0 },
      { label: 'Hepatotoxicity risk', value: (s) => s.derived.hepatotoxicityRisk * 100, unit: '%', decimals: 0 },
    ],
    explanation:
      'The early massive dose sits above the line: high plasma, nothing sequestered, and a close-in point on the curve. The charcoal survivor was the same size of dose an hour earlier, but forty percent of the load was captured before it reached the blood, dropping the point below its own line at the same early hour. The panel says so plainly — absorbed dose equal but charcoal uptake, then plasma together decide the picture. The histogram-reading skill is exactly the written exam one: give the same numbers, the answer falls out.',
  },
];