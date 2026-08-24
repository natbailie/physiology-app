import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { MedullaDerived, MedullaInputs, MedullaInternalState } from './engine/types';
import type { MedullaPresetName } from './engine/presets';
import { perturbParoxysm } from './engine/engine';

type Snapshot = { state: MedullaInternalState; derived: MedullaDerived };
export type MedullaQuestion = ModuleQuestion<MedullaInputs, MedullaPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'MAP', unit: 'mmHg', value: (s) => s.derived.mapMmHg, decimals: 0 },
  { label: 'Heart rate', unit: 'bpm', value: (s) => s.derived.heartRateBpm, decimals: 0 },
  {
    label: 'Orthostatic drop',
    unit: 'mmHg',
    value: (s) => s.derived.orthostaticDropMmHg,
    decimals: 0,
    tolerance: 0.3,
  },
  { label: 'Arrhythmia risk', unit: '%', value: (s) => s.derived.arrhythmiaRiskPct, decimals: 0, tolerance: 0.3 },
  { label: 'Triad signs', value: (s) => s.derived.triadCount, decimals: 0, tolerance: 0.5 },
];

const SETTLE = 30000;

export const MEDULLA_QUESTIONS: readonly MedullaQuestion[] = [
  {
    id: 'paroxysmal-palpitations-anxiety',
    stem: 'A woman in her thirties has attacks of pounding heart, anxiety and tremor lasting minutes. Between attacks she feels well. Her pressure swings widely.',
    answer: 'adPhaeochromocytoma',
    options: ['adPhaeochromocytoma', 'naPhaeochromocytoma', 'normal', 'crisisUncontrolled'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Palpitations and panic dominate when the tumour secretes ADRENALINE — the beta-heavy mix acts on the heart while adding only modest alpha vasoconstriction. Compare with the noradrenaline pattern: sustained pallor and pressure with a comparatively quiet pulse. The secretion MIX is the phenotype, which is why the ten-percent rule told surgeons where the adrenaline-making tumours would sit.',
  },
  {
    id: 'sustained-pressure-orthostatic',
    stem: 'A man in his fifties has persistent headache and hypertension with striking pallor during spikes. Standing from bed, he feels faint and his pressure falls sharply.',
    answer: 'naPhaeochromocytoma',
    options: ['naPhaeochromocytoma', 'adPhaeochromocytoma', 'properlyBlocked', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Noradrenaline works on alpha: weeks of vasoconstriction hold MAP high AND leak plasma volume down until standing produces a marked drop. Orthostatic hypotension inside a hypertensive patient is close to pathognomonic here. The triad — headache, sweating, palpitations — counts its way through this preset, but the volume sign is the one examiners hide in the vignette.',
  },
  {
    id: 'beta-first-worse-than-nothing',
    stem: 'A patient with a phaeochromocytoma was started on a beta-blocker for palpitations before any alpha blockade. His pressure has since risen dramatically.',
    answer: 'betaFirstError',
    options: ['betaFirstError', 'crisisUncontrolled', 'naPhaeochromocytoma', 'properlyBlocked'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Beta-blockade removed beta2 vasodilatation and left alpha vasoconstriction UNOPPOSED — so the same tumour now generates a higher MAP than no treatment at all. This is why phaeochromocytoma management is strictly sequential: alpha first (phenoxybenzamine), volume re-expanded, THEN beta for reflex tachycardia. The order of two drugs is the difference between preparation and catastrophe.',
  },
  {
    id: 'alpha-covers-the-paroxysm',
    stem: 'The same patient undergoes proper pre-operative alpha-blockade before beta is added.',
    setup: { preset: 'naPhaeochromocytoma' },
    intervention: { label: 'Alpha-blockade reaches full coverage.', inputs: { alphaBlockadePct: 80 } },
    prompt: 'What happens to mean arterial pressure?',
    watch: 'MAP',
    correctDirection: 'falls',
    settleSeconds: 20000,
    observeSeconds: 20000,
    explanation:
      'It falls toward ordinary numbers despite unchanged tumour secretion — the alpha receptor was the entire route by which noradrenaline raised the pressure. Once alpha is covered, beta-blockade can be added safely for the reflex tachycardia it unmasked. The catecholamines themselves are untouched; only their access to the circulation\'s dials is blocked.',
    metric: (s) => s.derived.mapMmHg,
  },
  {
    id: 'paroxysm-spikes-unblocked',
    stem: 'An undiagnosed patient with a noradrenaline-predominant tumour has a spontaneous attack during a dental procedure.',
    setup: { preset: 'naPhaeochromocytoma' },
    intervention: { label: 'Secretory paroxysm begins.', perturb: (state) => perturbParoxysm(state) },
    prompt: 'What happens to MAP?',
    watch: 'MAP',
    correctDirection: 'rises',
    settleSeconds: 20000,
    observeSeconds: 1500,
    tolerance: 0.02,
    explanation:
      'It spikes within seconds — paroxysms are EVENTS, bursts of secretion clearing with a half-life of minutes, which is why patients describe attacks rather than constant illness. This is also why random catecholamine sampling misses the diagnosis while metanephrines catch it: COMT methylates continuously, integrating the spikes. Trigger the same event on an alpha-covered patient and the surge flattens.',
    metric: (s) => s.derived.mapMmHg,
  },
];
