import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { HypersensitivityDerived, HypersensitivityInputs, HypersensitivityState } from './engine/types';
import type { HypersensitivityPresetName } from './engine/presets';
import { perturbAdrenaline, perturbChallenge } from './engine/engine';

type Snapshot = { state: HypersensitivityState; derived: HypersensitivityDerived };
export type HypersensitivityQuestion = ModuleQuestion<HypersensitivityInputs, HypersensitivityPresetName, Snapshot>;

/**
 * The panel that names the mechanism.
 *
 * Onset first, because it is the most discriminating single number and the one available
 * before any test is sent. Then the four tests that each light up for exactly one arm:
 * tryptase for I, Coombs and haptoglobin for II, complement for II and III together, and
 * induration for IV. No row names the type alone; the combination does.
 */
const MECHANISM_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Onset', unit: 'h', value: (s) => Math.max(s.derived.onsetHours, 0), decimals: 2 },
  { label: 'Tryptase', unit: 'ng/mL', value: (s) => s.derived.tryptaseNgMl, decimals: 0 },
  { label: 'C3', unit: 'mg/dL', value: (s) => s.derived.c3MgDl, decimals: 0 },
  { label: 'Direct Coombs', value: (s) => s.derived.directCoombs, decimals: 2 },
  { label: 'Haptoglobin', unit: 'mg/dL', value: (s) => s.derived.haptoglobinMgDl, decimals: 0 },
  { label: 'Temperature', unit: '°C', value: (s) => s.derived.temperatureC, decimals: 1 },
  { label: 'Induration', unit: 'mm', value: (s) => s.derived.indurationMm, decimals: 0 },
];

/**
 * Every pattern question is set up already challenged, and then settled far enough for the
 * SLOWEST arm to have declared itself. Settling for less would make type IV look like nothing
 * happening, which is exactly the mistake of reading a tuberculin test too early — a fine
 * clinical error to teach, but not one to build into the harness.
 */
const CHALLENGE = (state: HypersensitivityState) => perturbChallenge(state, 100);
const SETTLE = 76;

export const HYPERSENSITIVITY_QUESTIONS: readonly HypersensitivityQuestion[] = [
  // --- Naming the mechanism from the pattern ---
  {
    id: 'pattern-type-i',
    stem: 'A patient collapses ten minutes after a wasp sting. They are flushed, wheezing and profoundly hypotensive, and they are not febrile.',
    answer: 'typeIAnaphylaxis',
    options: ['typeIAnaphylaxis', 'typeIIHaemolysis', 'typeIIISerumSickness', 'typeIVContactDermatitis'],
    panel: MECHANISM_PANEL,
    setup: { perturb: CHALLENGE },
    settleSeconds: SETTLE,
    explanation:
      'The onset settles it before any test does. Ten minutes is too fast for antibody to find a target and far too fast for cells to traffic anywhere — only mediators that were already made and sitting in granules can act that quickly, which is type I and nothing else. The raised tryptase confirms it came from mast cells, the normal complement rules out the two antibody arms, and note the absence of fever: histamine does not produce one. A febrile reaction would have been evidence against this diagnosis before the tryptase came back.',
  },
  {
    id: 'pattern-type-ii',
    stem: 'A patient becomes jaundiced and febrile some hours after starting a new drug. Their haemoglobin has fallen and their urine is dark.',
    answer: 'typeIIHaemolysis',
    options: ['typeIIHaemolysis', 'typeIIISerumSickness', 'typeIAnaphylaxis', 'typeIVContactDermatitis'],
    panel: MECHANISM_PANEL,
    setup: { perturb: CHALLENGE },
    settleSeconds: SETTLE,
    explanation:
      'A positive direct Coombs is the finding that names this, and it names it precisely: the test detects antibody sitting ON the red cell, which can only happen when the antigen is fixed to a cell surface. That is the definition of type II. The consumed complement fits both antibody arms, so it does not discriminate — but the collapsed haptoglobin does, because haptoglobin is consumed mopping up free haemoglobin and there is no haemolysis in type III. Compare the serum sickness option: same low complement, negative Coombs, normal haptoglobin.',
  },
  {
    id: 'pattern-type-iii',
    stem: 'A patient is given a large dose of a foreign protein antitoxin. Some hours later they develop fever, joint pains, a rash and blood in the urine. They are not anaemic.',
    answer: 'typeIIISerumSickness',
    options: ['typeIIISerumSickness', 'typeIIHaemolysis', 'typeIVContactDermatitis', 'typeIAnaphylaxis'],
    panel: MECHANISM_PANEL,
    setup: { perturb: CHALLENGE },
    settleSeconds: SETTLE,
    explanation:
      'Complement is consumed, so an antibody arm is at work — and yet the Coombs is negative and the haptoglobin is untouched, so nothing is being destroyed on a cell surface. That combination places the antigen in the PLASMA rather than on a cell: antibody and soluble antigen meeting in the circulation, forming complexes, and depositing wherever vessels filter, which is why the joints, the skin and the glomerulus are all involved at once. Same antibody and same complement as type II; the location of the antigen is the entire difference.',
  },
  {
    id: 'pattern-type-iv',
    stem: 'A patient develops a firm, itchy, sharply demarcated rash two days after a new watch strap. It is indurated rather than swollen, and it is still there a week later.',
    answer: 'typeIVContactDermatitis',
    options: ['typeIVContactDermatitis', 'typeIAnaphylaxis', 'typeIIISerumSickness', 'typeIIHaemolysis'],
    panel: MECHANISM_PANEL,
    setup: { perturb: CHALLENGE },
    settleSeconds: SETTLE,
    explanation:
      'Two things point the same way. The onset is measured in days, which no antibody-mediated mechanism reaches, because the delay is cells physically travelling to the site. And the complement is stone normal, which rules out both antibody arms outright — there is no antibody in type IV at all. The induration is the mechanism made palpable: a cellular infiltrate is firm and slow, where the leaked plasma of a weal is soft and immediate. This is why a tuberculin test is read at 48 to 72 hours.',
  },

  // --- What the mechanism means for what happens next ---
  {
    id: 'naive-first-exposure',
    stem: 'A patient with no previous exposure to bee venom is stung for the first time. They have a completely normal immune system.',
    setup: { preset: 'naiveFirstExposure' },
    intervention: { label: 'They are stung.', perturb: CHALLENGE },
    prompt: 'What happens to tissue injury over the next few hours?',
    watch: 'tissue injury',
    correctDirection: 'unchanged',
    observeSeconds: 24,
    explanation:
      'Nothing happens, and that is the correct answer rather than a trick. A type I reaction requires antigen to cross-link IgE that is ALREADY bound to mast cells, and a host who has never met the antigen has none. Sensitisation is what a previous exposure leaves behind, so the first exposure can only create it, never act on it. This is why a first sting is usually a non-event and the second can be fatal on an identical dose — and why "they have had it before without trouble" is reassurance about the wrong thing.',
    metric: (s) => s.derived.tissueInjury,
  },
  {
    id: 'sensitised-rechallenge-drops-pressure',
    stem: 'A patient who was stung last summer, and who has carried specific IgE ever since, is stung again. The dose of venom is no different from last time.',
    setup: { preset: 'typeIAnaphylaxis' },
    intervention: { label: 'They are stung again.', perturb: CHALLENGE },
    prompt: 'What happens to their mean arterial pressure?',
    watch: 'the mean arterial pressure',
    correctDirection: 'falls',
    observeSeconds: 1,
    explanation:
      'It collapses within minutes, because anaphylaxis is a distributive shock: histamine dilates the arterioles and makes the capillaries leak, so the circulation loses both its resistance and its volume at once. Note the speed, which is the diagnostic point — the mediators were already made and waiting, so nothing had to be synthesised. Note also what is NOT happening: no fever, and normal complement. Of the four mechanisms this is the only one that drops the blood pressure, which is what makes it the one you have minutes rather than days to treat.',
    metric: (s) => s.derived.meanArterialPressureMmHg,
  },
  {
    id: 'adrenaline-rescues-type-i',
    stem: 'A sensitised patient is in the middle of an anaphylactic reaction. Their blood pressure has already fallen and intramuscular adrenaline is drawn up.',
    setup: { preset: 'typeIAnaphylaxis', perturb: CHALLENGE },
    intervention: { label: 'Adrenaline is given.', perturb: (state) => perturbAdrenaline(state) },
    prompt: 'What happens to the mean arterial pressure?',
    watch: 'the mean arterial pressure',
    correctDirection: 'rises',
    settleSeconds: 0.4,
    observeSeconds: 1,
    explanation:
      'It recovers, because adrenaline opposes precisely what histamine is doing — it constricts the dilated vessels, tightens the leaking capillaries and relaxes the bronchi. That is also exactly why it is useless in the other three types: there is no histamine in a type II, III or IV reaction for it to oppose, so the drug has nothing to work against. A treatment aimed at the wrong arm here is not weaker, it is inert, which is the strongest practical argument for naming the mechanism before reaching for a drug.',
    metric: (s) => s.derived.meanArterialPressureMmHg,
  },
  {
    id: 'blockade-does-nothing-to-type-iv',
    stem: 'A patient develops a contact dermatitis a day after a new watch strap. They take a large dose of antihistamine, on the reasonable-sounding grounds that it is an allergic rash, and keep wearing the strap.',
    setup: { preset: 'typeIVContactDermatitis', perturb: CHALLENGE },
    intervention: { label: 'Maximal histamine blockade is given.', inputs: { mastCellStabilisation: 100 } },
    prompt: 'What happens to the tissue injury over the next two days?',
    watch: 'tissue injury',
    correctDirection: 'rises',
    settleSeconds: 12,
    observeSeconds: 60,
    explanation:
      'It goes on getting worse, on exactly the schedule it would have followed if nothing had been given. There is no histamine anywhere in a type IV reaction to block: the damage is done by macrophages that T cells recruited, and an antihistamine has no purchase at any point in that chain. This is the clearest demonstration of why the classification is worth knowing — "allergic rash" is a description, and descriptions do not tell you what to prescribe. The same drug that transforms a type I reaction is completely inert here, and the only thing that helps is removing the antigen.',
    metric: (s) => s.derived.tissueInjury,
  },
  {
    id: 'complement-deficiency-spares-type-ii',
    stem: 'Two patients have identical antibody against a drug-modified red cell antigen. One of them has essentially no functioning complement.',
    setup: { preset: 'typeIIHaemolysis', perturb: CHALLENGE },
    intervention: { label: 'Complement function is lost.', inputs: { complementFunction: 0 } },
    prompt: 'What happens to the tissue injury?',
    watch: 'tissue injury',
    correctDirection: 'falls',
    settleSeconds: 24,
    observeSeconds: 48,
    explanation:
      'The injury falls, because complement does much of the actual killing in type II — antibody marks the cell, and complement lyses it. It does not fall to zero, because opsonised cells are also removed by phagocytes, which needs no complement at all. That split matters clinically: it is why complement-deficient patients are protected from some antibody-mediated damage while remaining fully capable of other kinds, and why measuring complement tells you about the mechanism rather than about the antibody.',
    metric: (s) => s.derived.tissueInjury,
  },
];
