import type { PredictQuestion } from '@/shared/assessment/types';
import type { HpgDerived, HpgInputs, HpgState } from './engine/types';
import type { HpgPresetName } from './engine/presets';

type Snapshot = { state: HpgState; derived: HpgDerived };
export type HpgQuestion = PredictQuestion<HpgInputs, HpgPresetName, Snapshot>;

export const HPG_QUESTIONS: readonly HpgQuestion[] = [
  {
    id: 'anabolic-steroid-suppression',
    stem: 'A man begins taking supraphysiological doses of testosterone. His hypothalamus, pituitary and testes were all previously normal.',
    setup: { preset: 'normalMaleAxis' },
    intervention: { label: 'Exogenous testosterone is started.', inputs: { exogenousTestosterone: 150 } },
    prompt: 'What happens to LH?',
    watch: 'LH',
    correctDirection: 'falls',
    settleSeconds: 900,
    observeSeconds: 900,
    explanation:
      'LH is suppressed, and with it the testicular production the user was trying to augment. The hypothalamus and pituitary read a combined steroid signal and cannot distinguish endogenous from exogenous, so the feedback loop does exactly what it is built to do — with a signal supplied from outside. This is why anabolic steroid use causes testicular atrophy and infertility despite a high total testosterone, and the combined oral contraceptive suppresses the female axis by precisely the same logic.',
    metric: (s) => s.derived.lhLevel,
  },
  {
    id: 'primary-hypogonadism-fsh',
    stem: 'A man has primary testicular failure. His hypothalamus and pituitary are entirely normal and the feedback loop is intact.',
    setup: { preset: 'normalMaleAxis' },
    intervention: { label: 'Gonadal function collapses.', inputs: { gonadalFunction: 0.05 } },
    prompt: 'What happens to FSH?',
    watch: 'FSH',
    correctDirection: 'rises',
    settleSeconds: 900,
    observeSeconds: 900,
    explanation:
      'FSH rises, and it rises disproportionately more than LH. Both are released from the same feedback failure, but FSH carries a second, dedicated brake — inhibin, made by the Sertoli cells. Lose testicular function and you lose testosterone AND inhibin, so FSH loses two restraints while LH loses one. That is why an FSH raised out of proportion to LH points specifically at seminiferous tubule failure, and why it is the more sensitive marker of impaired spermatogenesis.',
    metric: (s) => s.derived.fshLevel,
  },
  {
    id: 'continuous-gnrh-downregulates',
    stem: 'A patient is given a long-acting GnRH agonist. The drug occupies the receptor continuously rather than in the discrete pulses the hypothalamus normally delivers.',
    setup: { preset: 'normalMaleAxis' },
    intervention: { label: 'GnRH arrives continuously rather than in pulses.', inputs: { gnrhPulseFrequency: 2 } },
    prompt: 'What happens to pituitary responsiveness?',
    watch: 'pituitary responsiveness',
    correctDirection: 'falls',
    settleSeconds: 900,
    observeSeconds: 900,
    explanation:
      'Responsiveness falls, which is the counter-intuitive centrepiece of this axis. GnRH must arrive in discrete pulses; continuous exposure downregulates the receptors and shuts the axis down. That is why long-acting GnRH agonists are used as chemical castration in prostate cancer DESPITE being agonists, and it explains the initial flare before the downregulation takes hold. Note the relationship is non-monotonic — too infrequent also fails, which is the mechanism of hypothalamic amenorrhoea at the other end.',
    metric: (s) => s.derived.pituitaryResponsiveness,
  },
];
