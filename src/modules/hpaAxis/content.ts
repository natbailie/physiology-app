import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { HpaPresetName } from './engine/presets';

export const hpaAxisContent: ExplainerContent<HpaPresetName> = {
  title: 'How the HPA axis holds cortisol steady — and why it can’t recover overnight',
  sections: [
    {
      heading: 'Three stages, negative feedback, and a clock underneath',
      paragraphs: [
        'The hypothalamus releases CRH, which drives the pituitary to release ACTH, which drives the adrenal cortex to release cortisol. Rising cortisol then feeds back to suppress both CRH and ACTH — a classic three-stage negative-feedback cascade, on top of an intrinsic diurnal rhythm that peaks in the early morning.',
      ],
      demos: [
        { preset: 'normal', watch: 'cortisol' },
      ],
    },
    {
      heading: 'Where the lesion sits changes the ACTH pattern predictably',
      paragraphs: [
        'Where in the axis a lesion sits changes the ACTH/cortisol pattern in a predictable way: primary adrenal failure (Addison’s) can’t respond to ACTH, so ACTH rises unchecked while cortisol stays low. Pituitary failure can’t raise ACTH at all, so both stay low — the same low cortisol, but an opposite ACTH signature, is exactly how these are told apart on labs.',
      ],
      demos: [
        { preset: 'addisons', watch: 'ACTH' },
        { preset: 'secondaryInsufficiency', watch: 'ACTH' },
      ],
    },
    {
      heading: 'Exogenous steroid atrophies the gland it is replacing',
      paragraphs: [
        'Sustained high-dose exogenous glucocorticoid suppresses the whole axis and, over time, atrophies the adrenal cortex’s own capacity to respond — the gland stops being exercised. Stopping the steroid abruptly lets ACTH recover within hours, but the atrophied gland can’t immediately produce cortisol to match, leaving a dangerous window of inadequate response: this is why steroid courses are tapered, not stopped.',
      ],
      demos: [
        { preset: 'steroidTherapy', watch: 'adrenal reserve' },
      ],
    },
    {
      heading: 'Cortisol has no single normal value, because of the clock',
      paragraphs: [
        'Cortisol has no single normal value, because the axis is running a clock underneath it. Hypothalamic CRH drive is modulated diurnally, peaking near waking and falling through the day, so the same patient is legitimately several-fold different at eight in the morning and at midnight. This is why the time of the sample is part of the result rather than a detail attached to it, why a midnight cortisol carries information a morning one does not, and why the rhythm itself — not just the level — is what a screening test is often looking at.',
      ],
    },
    {
      heading: 'The danger in stopping steroids is an asymmetry, not a suppression',
      paragraphs: [
        'The danger in stopping steroids is an asymmetry, not simply a suppression. While exogenous glucocorticoid holds ACTH down, the adrenal cortex slowly atrophies. Regrowth needs the ACTH signal that is precisely what is being suppressed, so recovery cannot begin until the suppression lifts — and once it does, recovery runs considerably slower than the atrophy did. That gap is the whole problem: the axis can look recovered at the level of ACTH while the gland underneath is still unable to answer it, which is why steroids are tapered rather than stopped and why a patient weeks into a taper can still fail to mount a response to acute stress.',
      ],
    },
    {
      heading: 'An autonomous source is the mirror image of insufficiency',
      paragraphs: [
        'An autonomous, ACTH-independent source of cortisol — an adrenal adenoma — produces the mirror image of primary insufficiency, and reading the two together is the whole diagnostic logic of the axis. Cortisol is high, and because the negative feedback still works perfectly, the axis suppresses ACTH toward zero. Compare that with a pituitary-driven excess, where ACTH is high and cortisol is high because the drive is coming from above the feedback point. The rule generalises: whenever a hormone and its trophic signal move in the same direction the lesion is upstream, and whenever they move in opposite directions the lesion is in the gland itself.',
      ],
      demos: [
        { preset: 'adrenalAdenoma', watch: 'ACTH' },
      ],
    },
  ],
};
