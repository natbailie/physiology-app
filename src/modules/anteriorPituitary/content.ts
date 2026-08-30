import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { PituitaryPresetName } from './engine/presets';

export const anteriorPituitaryContent: ExplainerContent<PituitaryPresetName> = {
  title: 'One hormone is held down by the brain, and that single fact organises a differential',
  sections: [
    {
      heading: 'Two hormones under opposite architectures, one pushed and one braked',
      paragraphs: [
        'Growth hormone and prolactin sit side by side in the anterior pituitary under opposite architectures. GH is pushed by GHRH (and ghrelin), braked by somatostatin, and acts mostly through IGF-1 made in the liver — a two-step axis with negative feedback at both levels. Prolactin has no such push: its dominant control is tonic inhibition by hypothalamic dopamine. Cut the stalk and prolactin rises; block the D2 receptor with an antipsychotic and prolactin rises; nothing has to be secreted by anything for this to happen. That asymmetry is why hyperprolactinaemia is one of the commonest incidental endocrine findings and why the drug history comes before the MRI.',
      ],
      demos: [
        { preset: 'normal', watch: 'prolactin' },
      ],
    },
    {
      heading: 'How high the prolactin goes is itself diagnostic information',
      paragraphs: [
        'The magnitude of prolactin elevation is itself diagnostic information. A macroprolactinoma secretes hard and reaches into the hundreds. Stalk compression from any sellar mass — including a non-functioning adenoma — lifts prolactin only moderately, because some dopamine still gets through. Drug effects and TRH drive (primary hypothyroidism) land in between. Load each preset and read the numbers against those bands; then note what else moves: prolactin above about 30 suppresses GnRH, so gonadotrophins fall next — amenorrhoea, low libido, infertility — which is why a prolactin level belongs in the workup of a missed period with no other explanation.',
      ],
      demos: [
        { preset: 'macroprolactinoma', watch: 'prolactin' },
        { preset: 'nonFunctioningMass', watch: 'prolactin' },
        { preset: 'antipsychoticHyperprl', watch: 'prolactin' },
        { preset: 'hypothyroidHyperprl', watch: 'prolactin' },
      ],
    },
    {
      heading: 'The same adenoma writes a different disease at a different skeletal age',
      paragraphs: [
        'GH excess tells two different stories depending on skeletal age. With open epiphyses the same adenoma produces gigantism: linear growth accelerates, sometimes spectacularly. Once the plates fuse, growth can only go sideways — acral enlargement, jaw and ring changes, sweating, headache — acromegaly. Run both presets at identical secretion and watch height velocity versus acromegalic index trade places. The diagnostic test is beautifully mechanical: glucose normally suppresses GH below 1 ng/mL, but an adenoma ignores hypothalamic signals entirely. Run the oral glucose load on normal and acromegaly presets in turn — failure to suppress IS the diagnosis before any imaging.',
      ],
      demos: [
        { preset: 'gigantism', watch: 'height' },
        { preset: 'acromegaly', watch: 'acromegalic index' },
      ],
    },
    {
      heading: 'IGF-1 integrates growth hormone over days, so it is what you measure',
      paragraphs: [
        'IGF-1 integrates GH over days, which makes it the screening value of choice: a random GH fluctuates with pulses, sleep, exercise and stress, while IGF-1 reflects the average. Sustained excess drives tissue overgrowth on a timescale of months — watch the acromegalic index accrue — and brings its own metabolic baggage (diabetes, hypertension, sleep apnoea) because GH is a counter-regulatory hormone.',
      ],
    },
    {
      heading: 'Restoring the missing brake shrinks the tumour, not just the hormone',
      paragraphs: [
        'Treatment follows mechanism here more neatly than anywhere else in endocrinology. Bromocriptine and cabergoline are dopamine agonists: they restore the missing brake, so prolactin falls within hours and the prolactinoma shrinks over weeks — medical therapy as definitive treatment for a tumour. Watch both readouts fall after the dose. GH adenomas barely respond, which is why their pathway runs through surgery and somatostatin analogues instead. And a non-functioning macroadenoma reminds you that mass effect needs no hormone: bitemporal visual field loss from chiasmal compression with hormones otherwise intact, plus just enough stalk effect to raise prolactin misleadingly.',
      ],
      demos: [
        { preset: 'microprolactinoma', watch: 'prolactin' },
      ],
    },
  ],
};
