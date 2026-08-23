import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { ImmuneDerived, ImmuneInputs, ImmuneState } from './engine/types';
import type { ImmunePresetName } from './engine/presets';
import { perturbInfect, perturbVaccinate } from './engine/engine';

// Only two predict questions here, deliberately. Comparing a normal host against a deficient
// one is a two-run comparison, and this format is a single-run before/after — the engine's
// asymmetric time constants mean a response is already committed by the time a mid-course
// intervention lands. That comparison belongs to the frozen-baseline overlay instead.

type Snapshot = { state: ImmuneState; derived: ImmuneDerived };
export type ImmuneQuestion = ModuleQuestion<ImmuneInputs, ImmunePresetName, Snapshot>;

/**
 * The immune workup, read forty days into an infection.
 *
 * The two effector arms are on the panel separately because that is the entire discrimination:
 * a defect that takes out ONE arm and a defect that takes out both look identical if you only
 * record whether the patient cleared the organism.
 */
const IMMUNE_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Pathogen load', value: (s) => s.derived.pathogenLoad, decimals: 2 },
  { label: 'Helper T activity', value: (s) => s.derived.helperTActivity, decimals: 2 },
  { label: 'Cytotoxic T activity', value: (s) => s.derived.cytotoxicTActivity, decimals: 2 },
  { label: 'IgG titre', value: (s) => s.derived.iggTitre, decimals: 2 },
  { label: 'Temperature', unit: '°C', value: (s) => s.derived.temperatureC, decimals: 1, tolerance: 0.004 },
];

/** Forty simulated days — long enough for a competent host to have finished and a deficient
 * one to have visibly failed. */
const SETTLE = 40;
const INFECT = (state: ImmuneState) => perturbInfect(state);

export const IMMUNE_QUESTIONS: readonly ImmuneQuestion[] = [
  {
    id: 'primary-infection-load',
    stem: 'A previously unexposed host encounters a virulent organism for the first time. Their innate and adaptive immunity are both entirely normal.',
    setup: { preset: 'healthyHost' },
    intervention: { label: 'They are infected.', perturb: (state) => perturbInfect(state) },
    prompt: 'What happens to the pathogen load over the first few days?',
    watch: 'the pathogen load',
    correctDirection: 'rises',
    observeSeconds: 6,
    explanation:
      'It climbs steeply before anything stops it, and the delay is structural rather than a failure. Dendritic cells must sample antigen, traffic to a draining lymph node, and find the rare naive clone that recognises it; that clone must then expand. All of this takes days, and the organism is replicating exponentially throughout. The innate arm holds the line meanwhile — that holding action is what buys the time, and it is why innate deficiency is so dangerous even with a normal adaptive system.',
    metric: (s) => s.derived.pathogenLoad,
  },
  {
    id: 'vaccination-builds-memory',
    stem: 'A previously unexposed host is given a vaccine. It contains antigen only — nothing in it can replicate, and the host never becomes unwell.',
    setup: { preset: 'healthyHost' },
    intervention: { label: 'They are vaccinated.', perturb: (state) => perturbVaccinate(state) },
    prompt: 'What happens to immunological memory?',
    watch: 'memory',
    correctDirection: 'rises',
    observeSeconds: 20,
    explanation:
      'Memory forms with no infection at all, and that is the whole trick. The adaptive arm responds to ANTIGEN, not to damage, so antigen delivered without a replicating organism drives the same presentation, the same helper T licensing, the same class switching and the same memory. The host pays the cost of a primary response at a moment of its choosing, when nothing is dividing exponentially in the background. Memory then ratchets — it is never erased here, which is why the protection persists.',
    metric: (s) => s.derived.memoryLevel,
  },

  // --- Naming the defect from what survived it ---

  {
    id: 'pattern-cd4-depletion',
    stem: 'A patient has recurrent opportunistic infections that they cannot clear. This one has been running for weeks.',
    answer: 'hivCd4Depletion',
    options: ['hivCd4Depletion', 'bCellDeficiency', 'neutropenia', 'healthyHost'],
    panel: IMMUNE_PANEL,
    setup: { perturb: INFECT },
    settleSeconds: SETTLE,
    explanation:
      'BOTH effector arms are flat — no cytotoxic T activity and no antibody — and the organism is still there. Only one lesion does that, because helper T cells are the hub: they license cytotoxic T cells AND supply the second signal B cells need to class switch. Lose them and cellular and humoral immunity fail together. Compare the B-cell option, where the cytotoxic arm is working perfectly. That difference is why CD4 count predicts opportunistic infection so well, and why losing this one cell type is so much worse than losing either arm alone.',
  },
  {
    id: 'pattern-b-cell-deficiency',
    stem: 'A child has repeated infections with encapsulated bacteria but handles viral illnesses normally.',
    answer: 'bCellDeficiency',
    options: ['bCellDeficiency', 'hivCd4Depletion', 'neutropenia', 'healthyHost'],
    panel: IMMUNE_PANEL,
    setup: { perturb: INFECT },
    settleSeconds: SETTLE,
    explanation:
      'No antibody at all, and yet the cellular arm is vigorous — helper and cytotoxic T activity are both high. That dissociation localises the defect to the B cell, and it explains the clinical pattern in the stem exactly: antibody is what opsonises encapsulated bacteria, so those recur, while viruses are handled by cytotoxic T cells killing infected host cells and are dealt with normally. The treatment follows directly from the panel, which is immunoglobulin replacement rather than anything aimed at T cells.',
  },
  {
    id: 'pattern-neutropenia',
    stem: 'A patient on chemotherapy develops a severe infection that becomes overwhelming within a day or two, far faster than the same organism would normally progress.',
    answer: 'neutropenia',
    options: ['neutropenia', 'healthyHost', 'hivCd4Depletion', 'transplantImmunosuppression'],
    panel: IMMUNE_PANEL,
    setup: { perturb: INFECT },
    settleSeconds: SETTLE,
    explanation:
      'They clear it in the end — the adaptive arms are intact and the antibody response is normal — but look at how high the organism climbed before they did. Innate immunity cannot sterilise an infection; what it does is hold the line during the days the adaptive response needs to find and expand the right clone. Remove that holding action and the organism replicates unchecked throughout the delay, which is why neutropenic sepsis is a medical emergency measured in hours while the same organism in a competent host is an illness measured in days.',
  },
  {
    id: 'pattern-broad-immunosuppression',
    stem: 'A transplant recipient on a full immunosuppressive regimen develops an infection. Weeks later it is still progressing.',
    answer: 'transplantImmunosuppression',
    options: ['transplantImmunosuppression', 'hivCd4Depletion', 'bCellDeficiency', 'neutropenia'],
    panel: IMMUNE_PANEL,
    setup: { perturb: INFECT },
    settleSeconds: SETTLE,
    explanation:
      'Everything is suppressed at once — innate, cellular and humoral — and the organism has reached its ceiling. That breadth is what separates pharmacological immunosuppression from a single-cell defect: the CD4-depleted patient still has innate immunity holding some line, and this patient has nothing. Note the fever is the highest on the panel while the immune response is the weakest, which is worth sitting with: the temperature is driven by the pathogen burden and the innate cytokines it provokes, not by how well the response is going.',
  },
];
