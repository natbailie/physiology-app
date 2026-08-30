import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { HpgPresetName } from './engine/presets';

export const hpgAxisContent: ExplainerContent<HpgPresetName> = {
  title: 'The one axis that reverses its own feedback',
  sections: [
    {
      heading: 'The one axis in this app that reverses its own feedback',
      paragraphs: [
        'Every other feedback loop in this app is permanently negative: the output suppresses its own drive, and the system settles. The female HPG axis is the exception. Through the follicular phase, rising estrogen suppresses LH in the ordinary way — but once estrogen has been high for long enough, the sign flips and estrogen begins to drive LH instead, producing the ovulatory surge. Watch the feedback arrow on the diagram change from inhibitory to stimulatory as it happens.',
      ],
      demos: [
        { preset: 'normalFemaleCycle', watch: 'LH' },
      ],
    },
    {
      heading: 'The switch depends on duration, which is why it fires once',
      paragraphs: [
        'The switch depends on duration as well as level, which is why it fires cleanly once per cycle rather than oscillating. A transient estrogen rise accumulates a little exposure and decays away harmlessly; only the sustained climb of a maturing dominant follicle crosses the threshold. That follicle becomes progressively FSH-independent as it grows, which is exactly what lets its estrogen output escape the negative feedback that would otherwise throttle it. After ovulation the ruptured follicle becomes the corpus luteum, and its progesterone promptly restores negative feedback — closing the window.',
      ],
    },
    {
      heading: 'GnRH must arrive in pulses, and continuous is worse than sparse',
      paragraphs: [
        'GnRH must arrive in pulses, not continuously. Too infrequent and the gonadotropes are never adequately driven, which is how stress or low energy availability causes hypothalamic amenorrhea. Continuous exposure is worse still: it downregulates pituitary GnRH receptors and shuts the axis down entirely. That is the GnRH-agonist paradox — long-acting agonists like leuprolide are used as chemical castration precisely because they abolish pulsatility.',
      ],
      demos: [
        { preset: 'hypothalamicAmenorrhea', watch: 'LH pulses' },
      ],
    },
    {
      heading: 'Exogenous steroid suppresses through the pathway it supplements',
      paragraphs: [
        'Exogenous sex steroids suppress the axis through exactly the pathway they appear to be supplementing. The hypothalamus and pituitary read a combined steroid signal and cannot tell endogenous from exogenous, so anabolic steroid use shuts down LH and FSH and with them the testicular production the user was trying to augment — and a combined oral contraceptive suppresses the axis by the same logic, which is precisely how it prevents the LH surge. The feedback loop is doing its job perfectly; it is simply being fed a signal from outside.',
      ],
      demos: [
        { preset: 'anabolicSteroidUse', watch: 'LH' },
        { preset: 'combinedOCP', watch: 'FSH' },
      ],
    },
    {
      heading: 'The phase is named from the hormonal event, not the calendar',
      paragraphs: [
        'Notice that the cycle phase here is named from the hormonal event rather than from the calendar. Ovulation is reported when the positive-feedback state actually fires, not when the clock reaches day fourteen. That ordering matters clinically because the follicular phase is the variable one — a long or short cycle is almost always a longer or shorter run-up to the surge, while the luteal phase that follows is comparatively fixed. Cycle day is a proxy for hormonal state, and a mediocre one.',
      ],
    },
    {
      heading: 'The male axis runs two loops, and the second one localises',
      paragraphs: [
        'The male axis runs two loops rather than one. LH drives Leydig-cell testosterone, which feeds back on both hypothalamus and pituitary; FSH drives Sertoli cells, which release inhibin, a brake acting selectively on FSH. That second loop is diagnostically useful — in primary testicular failure the loss of inhibin lifts FSH disproportionately to LH. It also explains why exogenous testosterone causes infertility: the high blood level suppresses LH and FSH, so intratesticular testosterone and spermatogenesis collapse despite the elevated total. The combined oral contraceptive works the same way in reverse — sustained exogenous steroid keeps gonadotropins suppressed, no dominant follicle matures, and the surge never fires.',
      ],
      demos: [
        { preset: 'normalMaleAxis', watch: 'inhibin' },
        { preset: 'primaryHypogonadism', watch: 'FSH' },
      ],
    },
  ],
};
