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
      'FSH rises, and it rises disproportionately more than LH. Both are released from the same feedback failure, but FSH carries a second, dedicated brake — inhibin, made by the Sertoli cells. Lose testicular function and you lose testosterone and inhibin, so FSH loses two restraints while LH loses one. That is why an FSH raised out of proportion to LH points specifically at seminiferous tubule failure, and why it is the more sensitive marker of impaired spermatogenesis.',
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
      'Responsiveness falls, which is the counter-intuitive centrepiece of this axis. GnRH must arrive in discrete pulses; continuous exposure downregulates the receptors and shuts the axis down. That is why long-acting GnRH agonists are used as chemical castration in prostate cancer despite being agonists, and it explains the initial flare before the downregulation takes hold. Note the relationship is non-monotonic — too infrequent also fails, which is the mechanism of hypothalamic amenorrhoea at the other end.',
    metric: (s) => s.derived.pituitaryResponsiveness,
  },

  {
    id: 'ocp-suppresses-lh',
    stem: 'A woman starts a combined oral contraceptive. Her ovaries and pituitary are entirely normal.',
    setup: { preset: 'normalFemaleCycle' },
    intervention: { label: 'Combined oestrogen and progestogen are taken continuously.', inputs: { exogenousEstrogenProgesterone: 85 } },
    prompt: 'What happens to LH?',
    watch: 'LH',
    correctDirection: 'falls',
    observeSeconds: 2000,
    explanation:
      'LH is suppressed, and suppressing it is precisely how the pill works: no LH surge means no ovulation. The mechanism is the steroid feedback that already exists, used deliberately — continuous oestrogen and progestogen hold the axis in its negative-feedback mode and never allow the switch to positive feedback that generates the surge. Note the contrast with the natural cycle, where rising oestrogen from a mature follicle flips that switch. Same hormones, same receptors; the difference is whether the level is steady or rising.',
    metric: (s) => s.derived.lhLevel,
  },
  {
    id: 'hypothalamic-amenorrhoea',
    stem: 'A young athlete training intensively on a low energy intake stops menstruating. Her ovaries and pituitary are structurally normal.',
    setup: { preset: 'normalFemaleCycle' },
    intervention: { label: 'Hypothalamic GnRH output is suppressed.', inputs: { hypothalamicSuppression: 85 } },
    prompt: 'What happens to oestrogen?',
    watch: 'oestrogen',
    correctDirection: 'falls',
    observeSeconds: 2000,
    explanation:
      'Oestrogen falls, and the whole axis is quiet — low GnRH, low LH and FSH, low oestrogen. That pattern is what identifies the level of the lesion: an ovary that had failed would show high gonadotrophins, because the pituitary would be shouting at it. Here nothing is shouting, which places the problem at the top. The clinical consequence is not merely the missed periods but the bone density lost while oestrogen is low, which is why this is treated rather than accepted as a consequence of training.',
    metric: (s) => s.derived.estrogenLevel,
  },
  {
    id: 'gonadal-failure-raises-lh',
    stem: 'A man has primary testicular failure. His hypothalamus and pituitary are entirely normal.',
    setup: { preset: 'normalMaleAxis' },
    intervention: { label: 'Gonadal function collapses.', inputs: { gonadalFunction: 0.1 } },
    prompt: 'What happens to LH?',
    watch: 'LH',
    correctDirection: 'rises',
    observeSeconds: 2000,
    explanation:
      'LH rises, because the pituitary is working perfectly and is responding to the loss of testosterone feedback exactly as it should. High gonadotrophins with a low sex steroid is the signature of primary gonadal failure, and it is the direct mirror of the secondary picture where both are low. Note that FSH usually rises further and earlier than LH, because inhibin from the seminiferous tubules is a separate feedback signal and tubular function typically fails before Leydig cell function does.',
    metric: (s) => s.derived.lhLevel,
  }
];
