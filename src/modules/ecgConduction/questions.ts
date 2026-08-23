import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import { stDeviationMv } from './engine/injuryCurrent';
import { PRECORDIAL_ORDER } from './engine/leadProjection';
import type { EcgDerived, EcgInputs, EcgState, LeadName } from './engine/types';
import type { EcgPresetName } from './engine/presets';

type Snapshot = { state: EcgState; derived: EcgDerived };
export type EcgQuestion = ModuleQuestion<EcgInputs, EcgPresetName, Snapshot>;

/**
 * ST deviation in one lead, mV.
 *
 * Read from the pure injury-current function rather than off the live trace, because the trace
 * is only at its ST segment for part of each beat and a sampled oscillating quantity is
 * meaningless — see the note on this in CLAUDE.md. The deviation itself is static for a given
 * injury and territory, which is exactly what a lab-panel row needs.
 */
const stIn = (lead: LeadName) => (s: Snapshot) =>
  stDeviationMv(s.derived.ischemicInjury, s.derived.injuryTerritory, lead);

/**
 * Four leads facing four different ways. No single row names the territory; the PATTERN across
 * them does, which is the whole reason twelve electrodes are used instead of one.
 */
const ST_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'ST in II', unit: 'mV', value: stIn('II'), decimals: 2 },
  { label: 'ST in aVL', unit: 'mV', value: stIn('aVL'), decimals: 2 },
  { label: 'ST in V2', unit: 'mV', value: stIn('V2'), decimals: 2 },
  { label: 'ST in V5', unit: 'mV', value: stIn('V5'), decimals: 2 },
];

/** Position of the R/S transition across the precordium, as an index V1=0 … V6=5. */
const transitionIndex = (s: Snapshot) =>
  s.derived.rWaveTransitionLead ? PRECORDIAL_ORDER.indexOf(s.derived.rWaveTransitionLead) : PRECORDIAL_ORDER.length;

export const ECG_QUESTIONS: readonly EcgQuestion[] = [
  {
    id: 'bundle-block-widens-qrs',
    stem: 'A patient develops a right bundle branch block. The AV node conducts normally and the atria are unaffected.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'Right bundle conduction fails.', inputs: { rightBundleConduction: 0.05 } },
    prompt: 'What happens to the QRS duration?',
    watch: 'the QRS duration',
    correctDirection: 'rises',
    explanation:
      'The QRS widens, because that territory can no longer be activated through the fast conducting system and must instead be depolarised slowly, muscle cell to muscle cell, from the other ventricle. Note what does NOT change: the PR interval is unaffected, because the block is below the AV node. Width without PR prolongation localises the problem to the bundle branches, which is exactly how the two levels of block are told apart.',
    metric: (s) => s.derived.qrsDurationMs,
  },
  {
    id: 'av-delay-lengthens-pr',
    stem: 'A patient is found to have first-degree heart block. Every P wave is still followed by a QRS, and the ventricles themselves conduct normally.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'AV conduction slows markedly.', inputs: { avDelayMs: 320 } },
    prompt: 'What happens to the PR interval?',
    watch: 'the PR interval',
    correctDirection: 'rises',
    explanation:
      'The PR interval lengthens, since it measures the time from atrial activation to ventricular activation and the AV node is what occupies most of it. Note the PR SEGMENT stays flat throughout — not because nothing is happening, but because the AV node holds far too little tissue to register at the body surface. A flat line means no net vector, never no activity, and that distinction is what makes the ECG readable at all.',
    metric: (s) => s.derived.prIntervalMs,
  },
  {
    id: 'rate-shortens-qt',
    stem: 'A patient\'s heart rate rises from 70 to 140. Their electrolytes are normal and they are on no rate-affecting drugs.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'Heart rate doubles to 140.', inputs: { heartRate: 140 } },
    prompt: 'What happens to the raw QT interval?',
    watch: 'the QT interval',
    correctDirection: 'falls',
    explanation:
      'The raw QT shortens, and for a real physiological reason rather than a measurement artefact: action potential duration genuinely shortens as rate rises, because the tissue repolarises faster when driven harder. That is exactly what Bazett\'s correction exists to undo, which is why the CORRECTED value is the one that carries meaning. Watch the QTc stay comparatively stable while the raw QT moves — that is the correction doing its job.',
    metric: (s) => s.derived.qtIntervalMs,
  },

  // --- The horizontal plane: what six leads cannot see ---

  {
    id: 'lbbb-delays-transition',
    stem: 'A patient develops a left bundle branch block. Nothing else about their heart has changed — the same muscle, the same mass, the same blood supply.',
    setup: { preset: 'normalSinus' },
    intervention: { label: 'Left bundle conduction fails.', inputs: { leftBundleConduction: 0.05 } },
    prompt: 'Where does the R/S transition move to across the chest leads?',
    watch: 'the R/S transition (V1 = 1, V6 = 6)',
    correctDirection: 'rises',
    explanation:
      'The transition moves LATER across the precordium — toward V5 and V6 — which on a report is written up as poor R-wave progression. The reason is purely one of sequence: the left ventricle is the large posterior mass whose vector normally swings round to face the lateral chest leads early in the complex, and blocking its bundle means it is now activated last, slowly, cell to cell from the right. So the anterior and rightward forces dominate for longer and it takes more electrodes before the net vector is finally pointing at the recording one. Nothing about the muscle changed, only the order it was switched on in.',
    metric: transitionIndex,
  },
  {
    id: 'anterior-injury-elevates-v3',
    stem: 'A patient has an occluded left anterior descending artery. The infarcting territory is the anterior wall of the left ventricle.',
    setup: { preset: 'normalSinus' },
    intervention: {
      label: 'An anterior injury current develops.',
      inputs: { ischemicInjury: 0.8, injuryTerritory: 'anterior' },
    },
    prompt: 'What happens to the ST segment in V3?',
    watch: 'ST deviation in V3',
    correctDirection: 'rises',
    explanation:
      'It elevates sharply, because V3 sits on the chest wall almost directly over the injured muscle and the injury current points straight at it. Note what the limb leads are doing at the same time: almost nothing, because the anterior wall points forward and the frontal plane cannot see forward. This is the case that justifies twelve electrodes rather than six — an ECG confined to the limb leads would call this patient normal while their anterior wall infarcted.',
    metric: stIn('V3'),
  },
  {
    id: 'inferior-injury-depresses-avl',
    stem: 'A patient has an inferior infarct. Someone asks whether the ST depression in aVL means a second territory is also ischaemic.',
    setup: { preset: 'normalSinus' },
    intervention: {
      label: 'An inferior injury current develops.',
      inputs: { ischemicInjury: 0.8, injuryTerritory: 'inferior' },
    },
    prompt: 'What happens to the ST segment in aVL?',
    watch: 'ST deviation in aVL',
    correctDirection: 'falls',
    explanation:
      'It depresses, and it is not a second problem. aVL looks from about −30°, nearly opposite the inferior wall, so the identical injury vector that projects positively onto II, III and aVF projects negatively onto aVL. A reciprocal change is one event seen from behind, not two events. It is worth recognising for a practical reason: reciprocal depression is often clearer than the elevation that caused it, and in a subtle inferior infarct aVL can be the lead that gives it away.',
    metric: stIn('aVL'),
  },

  // --- Localising an infarct: the pattern-discrimination half ---

  {
    id: 'st-pattern-inferior',
    stem: 'A patient has crushing chest pain and is bradycardic and nauseated. Their ST segments read as below.',
    answer: 'inferiorStemi',
    options: ['inferiorStemi', 'anteriorStemi', 'posteriorMi', 'normalSinus'],
    panel: ST_PANEL,
    explanation:
      'Elevation in II with reciprocal depression in aVL, and the chest leads essentially untouched. That combination places the injury on the inferior wall: II faces it, aVL faces away from it, and the precordial electrodes are wrapped round the front where they can see neither. The bradycardia and nausea in the stem fit — the inferior wall and the SA and AV nodes usually share a blood supply, which is why inferior infarcts come with vagal symptoms and heart block far more often than anterior ones do.',
  },
  {
    id: 'st-pattern-anterior',
    stem: 'A patient is breathless with central chest pain. Their limb leads look almost unremarkable.',
    answer: 'anteriorStemi',
    options: ['anteriorStemi', 'inferiorStemi', 'posteriorMi', 'normalSinus'],
    panel: ST_PANEL,
    explanation:
      'Marked elevation across the anterior chest leads while the limb leads sit close to the baseline. The anterior wall points forward, and the frontal plane has no axis that points forward, so six leads genuinely cannot see this infarct — which is why the limb leads looking unremarkable is a description of the geometry rather than reassurance. Note this is the territory with the most muscle behind it, and the one where the difference between reading twelve leads and reading six is measured in ventricle.',
  },
  {
    id: 'st-pattern-posterior',
    stem: 'A patient has ongoing chest pain. There is ST DEPRESSION in the anterior chest leads and nothing is elevated anywhere. The team is considering whether this is simply anterior ischaemia.',
    answer: 'posteriorMi',
    options: ['posteriorMi', 'anteriorStemi', 'inferiorStemi', 'normalSinus'],
    panel: ST_PANEL,
    explanation:
      'This is a posterior infarct, and nothing is elevated because no electrode faces the back of the heart. What the anterior leads are showing is the mirror image of an elevation happening on a wall nobody is recording from — depression in V1 to V3 is, geometrically, elevation seen from the opposite side. Mistaking it for anterior ischaemia is the classic error, and the consequence is real: this patient needs reperfusion, not observation. Compare the anterior option, where the same leads move the other way entirely.',
  },
];
