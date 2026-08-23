import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { HypersensitivityDerived, HypersensitivityInputs, HypersensitivityState } from './engine/types';
import type { HypersensitivityPresetName } from './engine/presets';
import { perturbAdrenaline, perturbChallenge, perturbDiurese, perturbTransfuse } from './engine/engine';

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
  // Body temperature is an absolute-offset quantity, so a clinically enormous 1 degree fever is
  // only a 2.7% relative change against 37 and the default tolerance calls it noise. The
  // threshold that matters here is about a sixth of a degree.
  { label: 'Temperature', unit: '°C', value: (s) => s.derived.temperatureC, decimals: 1, tolerance: 0.004 },
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

/**
 * The transfusion panel. Same idea as the mechanism panel, plus the three rows that only
 * matter once blood is involved: the haemoglobin a transfusion is supposed to raise, the
 * saturation that falls in BOTH kinds of wet lung, and the BNP that is the only thing
 * separating them.
 */
const TRANSFUSION_PANEL: readonly PanelField<Snapshot>[] = [
  // Body temperature is an absolute-offset quantity, so a clinically enormous 1 degree fever is
  // only a 2.7% relative change against 37 and the default tolerance calls it noise. The
  // threshold that matters here is about a sixth of a degree.
  { label: 'Temperature', unit: '°C', value: (s) => s.derived.temperatureC, decimals: 1, tolerance: 0.004 },
  { label: 'Haemoglobin', unit: 'g/dL', value: (s) => s.derived.haemoglobinGDl, decimals: 1 },
  { label: 'Direct Coombs', value: (s) => s.derived.directCoombs, decimals: 2 },
  { label: 'Haptoglobin', unit: 'mg/dL', value: (s) => s.derived.haptoglobinMgDl, decimals: 0 },
  { label: 'C3', unit: 'mg/dL', value: (s) => s.derived.c3MgDl, decimals: 0 },
  { label: 'SaO2', unit: '%', value: (s) => s.derived.saO2Percent, decimals: 0 },
  { label: 'BNP', unit: 'pg/mL', value: (s) => s.derived.bnpPgMl, decimals: 0 },
  { label: 'MAP', unit: 'mmHg', value: (s) => s.derived.meanArterialPressureMmHg, decimals: 0 },
];

const TRANSFUSE = (state: HypersensitivityState) => perturbTransfuse(state);

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

  // --- Transfusion: the same mechanisms, arriving in a bag ---

  {
    id: 'transfusion-abo-incompatible',
    stem: 'A patient who has never been transfused before is given their first unit of blood. Within the hour they are febrile with loin pain, and their urine has gone dark.',
    answer: 'aboIncompatible',
    options: ['aboIncompatible', 'febrileNonHaemolytic', 'delayedHaemolytic', 'taco'],
    panel: TRANSFUSION_PANEL,
    setup: { perturb: TRANSFUSE },
    settleSeconds: 20,
    explanation:
      'The haemoglobin has FALLEN after a transfusion, which should stop anyone in their tracks, and the positive Coombs with a collapsed haptoglobin and consumed complement says the transfused cells are being destroyed. Note what makes this one different from everything else in the module: it needed no prior exposure at all. Anti-A and anti-B are naturally occurring, present from infancy without ever having met foreign blood, so "they have never been transfused" is not the reassurance it sounds like. Mechanistically this is a type II reaction, using exactly the same arm as an autoimmune haemolysis.',
  },
  {
    id: 'transfusion-febrile-non-haemolytic',
    stem: 'A patient develops a temperature of 38.2 an hour into a transfusion. They feel unwell but their observations are otherwise unremarkable and their urine is clear.',
    answer: 'febrileNonHaemolytic',
    options: ['febrileNonHaemolytic', 'aboIncompatible', 'trali', 'anaphylacticIgaDeficient'],
    panel: TRANSFUSION_PANEL,
    setup: { perturb: TRANSFUSE },
    settleSeconds: 5,
    explanation:
      'The emptiness of the rest of the panel is the diagnosis. There is a fever and nothing else: the haemoglobin rose exactly as it should, the Coombs is negative, complement is untouched, the saturation and the blood pressure are normal. That combination is not any of the four hypersensitivity types — it is cytokines that accumulated in the bag during storage, released from donor white cells. Worth recognising because it is common, benign, and prevented by leukodepletion rather than by anything done to the patient. But it is a diagnosis of exclusion, and the exclusion is the work.',
  },
  {
    id: 'transfusion-taco-vs-trali',
    stem: 'An elderly patient with poor cardiac function becomes breathless two hours into a transfusion. The chest film shows bilateral shadowing and they are hypoxic.',
    answer: 'taco',
    options: ['taco', 'trali', 'febrileNonHaemolytic', 'aboIncompatible'],
    panel: TRANSFUSION_PANEL,
    setup: { perturb: TRANSFUSE },
    settleSeconds: 2,
    explanation:
      'Both this and TRALI produce a breathless, hypoxic patient with a white chest film, and the saturation cannot separate them. The BNP can. It is released by a STRETCHED ventricle, so it is high here — the circulation has been given more volume than it can clear — and it stays normal in TRALI, where the lung fills because the capillaries leak and the ventricle is never loaded at all. The distinction is not academic: this patient needs the volume taken off, and giving a diuretic to the TRALI patient achieves nothing while delaying the respiratory support they actually need.',
  },
  {
    id: 'transfusion-trali',
    stem: 'A young patient with a normal heart becomes acutely breathless and hypoxic during a transfusion. Their chest film is white and they are not febrile.',
    answer: 'trali',
    options: ['trali', 'taco', 'anaphylacticIgaDeficient', 'delayedHaemolytic'],
    panel: TRANSFUSION_PANEL,
    setup: { perturb: TRANSFUSE },
    settleSeconds: 6,
    explanation:
      'A wet lung with a NORMAL BNP. Nothing is stretching the ventricle, so the fluid in the alveoli did not arrive by hydrostatic pressure — the pulmonary capillaries are leaking, because antibody in the DONOR plasma has activated this patient\'s neutrophils. That donor-side origin is the practical point: TRALI is a property of the unit rather than of the recipient, which is why it is prevented by donor screening and why no amount of pre-medicating the patient would have helped. Treatment is respiratory support; a diuretic here does nothing.',
  },
  {
    id: 'transfusion-delayed-haemolytic',
    stem: 'A patient transfused uneventfully four days ago is readmitted mildly jaundiced. Their haemoglobin is lower than it was on the day they went home.',
    answer: 'delayedHaemolytic',
    options: ['delayedHaemolytic', 'aboIncompatible', 'febrileNonHaemolytic', 'compatibleTransfusion'],
    panel: TRANSFUSION_PANEL,
    setup: { perturb: TRANSFUSE },
    settleSeconds: 76,
    explanation:
      'A positive Coombs with a falling haemoglobin, days rather than minutes after the transfusion. The delay is the mechanism: this is antibody against a MINOR red cell antigen that the patient met once before, and it has to be re-made from memory. Making antibody takes days, which is why the transfusion itself was uneventful and why this is found on a blood count rather than at the bedside. Same type II arm as the ABO reaction, and the only difference is whether the antibody was already there.',
  },
  {
    id: 'diuretic-in-trali',
    stem: 'A patient is breathless and hypoxic after a transfusion. Their lung fields are white, and a diuretic is given on the assumption that they are fluid overloaded. Their BNP, which nobody has looked at yet, is normal.',
    setup: { preset: 'trali', perturb: TRANSFUSE },
    intervention: { label: 'A diuretic is given.', perturb: (state) => perturbDiurese(state) },
    prompt: 'What happens to their oxygen saturation?',
    watch: 'the oxygen saturation',
    correctDirection: 'unchanged',
    settleSeconds: 6,
    observeSeconds: 2,
    explanation:
      'Nothing improves, because there was never any excess volume to remove. The alveoli are wet from leaking capillaries, not from hydrostatic pressure, and the normal BNP was already telling anyone who looked that the ventricle was not being stretched. The identical treatment transforms the overloaded patient in the next bed. Two patients, one chest film, one saturation, and opposite treatments — separated by a single number that costs nothing to send.',
    metric: (s) => s.derived.saO2Percent,
  },
  {
    id: 'first-transfusion-is-not-safe',
    stem: 'A patient has never received blood in their life. They are given an ABO-incompatible unit in error.',
    setup: { preset: 'aboIncompatible' },
    intervention: { label: 'The unit is transfused.', perturb: TRANSFUSE },
    prompt: 'What happens to the haptoglobin?',
    watch: 'the haptoglobin',
    correctDirection: 'falls',
    observeSeconds: 24,
    explanation:
      'It collapses, because the transfused cells are being destroyed and haptoglobin is consumed mopping up the free haemoglobin they release. The important part is that this happened on a FIRST exposure. Everywhere else in this module a naive host is safe, because sensitisation is what a previous exposure leaves behind — but anti-A and anti-B are naturally occurring and present from infancy. Blood is the exception to the rule the rest of the module teaches, and it is the exception that kills people.',
    metric: (s) => s.derived.haptoglobinMgDl,
  },
];