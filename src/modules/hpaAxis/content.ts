import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const hpaAxisContent: ExplainerContent = {
  title: 'How the HPA axis holds cortisol steady — and why it can’t recover overnight',
  paragraphs: [
    'The hypothalamus releases CRH, which drives the pituitary to release ACTH, which drives the adrenal cortex to release cortisol. Rising cortisol then feeds back to suppress both CRH and ACTH — a classic three-stage negative-feedback cascade, on top of an intrinsic diurnal rhythm that peaks in the early morning.',
    'Where in the axis a lesion sits changes the ACTH/cortisol pattern in a predictable way: primary adrenal failure (Addison’s) can’t respond to ACTH, so ACTH rises unchecked while cortisol stays low. Pituitary failure can’t raise ACTH at all, so both stay low — the same low cortisol, but an opposite ACTH signature, is exactly how these are told apart on labs.',
    'Sustained high-dose exogenous glucocorticoid suppresses the whole axis and, over time, atrophies the adrenal cortex’s own capacity to respond — the gland stops being exercised. Stopping the steroid abruptly lets ACTH recover within hours, but the atrophied gland can’t immediately produce cortisol to match, leaving a dangerous window of inadequate response: this is why steroid courses are tapered, not stopped.',
    'An autonomous (ACTH-independent) source of cortisol, such as an adrenal adenoma, produces the opposite ACTH pattern to primary insufficiency: cortisol is high, and the axis’s own negative feedback suppresses ACTH toward zero.',
  ],
};
