import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { AdrenalCortexPresetName } from './engine/presets';

export const adrenalCortexContent: ExplainerContent<AdrenalCortexPresetName> = {
  title: 'One pathway, four enzymes, and a fingerprint at every block',
  sections: [
    {
      heading: 'A block does not just subtract — it makes the gland pile up what it cannot use',
      paragraphs: [
        'The adrenal cortex is one biochemical assembly line running in three zones. Cholesterol becomes pregnenolone, then the line branches: toward aldosterone (glomerulosa), cortisol (fasciculata), or adrenal androgens (reticularis). Every CAH phenotype is a partial roadblock somewhere on that line, and because ACTH rises when cortisol falls, the gland upstream of the block is flogged harder — so intermediates ACCUMULATE rather than simply disappearing. That single principle explains why 17-hydroxyprogesterone is the newborn screening analyte for 21-hydroxylase deficiency: it is made in abundance and cannot get past the block.',
      ],
      demos: [{ preset: 'normal', label: 'Normal pathway', watch: '17-OHP' }],
    },
    {
      heading: '21-hydroxylase deficiency is the pattern every other block is compared against',
      paragraphs: [
        '21-hydroxylase deficiency is the commonest form and the pattern to learn first. The block sits where both cortisol AND aldosterone need it, so salt-wasting crisis threatens while the diverted flux pours into androgens — virilised females, precocious puberty in males. Partial blocks spare enough mineralocorticoid to avoid crisis but not enough to stop virilisation: the simple-virilising form is the same enzyme, milder dose. Treatment replaces what is missing and, crucially, suppresses the ACTH drive fuelling the androgen excess — watch crisis risk fall on the treated preset even though endogenous production stays collapsed.',
      ],
      demos: [
        { preset: 'cah21SaltWasting', watch: 'crisis risk' },
        { preset: 'cah21SimpleVirilising', watch: 'androgens' },
        { preset: 'cah21Treated', watch: 'crisis risk' },
      ],
    },
    {
      heading: 'The rarer blocks each invert a different part of the picture',
      paragraphs: [
        'Then compare the rarer blocks, because each inverts part of the picture. 11β-hydroxylase deficiency also diverts toward androgens, but its trapped precursor is DOC — a weak mineralocorticoid that piles up enough to cause HYPERTENSION, which makes salt-wasting impossible. 17α-hydroxylase deficiency is the mirror image entirely: with no pathway to cortisol or androgens, everything floods the mineralocorticoid arm — hypertension WITH absent androgens, undervirilised males, sexually infantile females. And 3β-HSD deficiency knocks out the earliest shared step, so EVERYTHING downstream falls including DHEA-derived androgens — salt-wasting with UNDER-virilisation, and a LOW 17-OHP that distinguishes it biochemically from 21-OH.',
      ],
      demos: [
        { preset: 'cah11', watch: 'blood pressure' },
        { preset: 'cah17', watch: 'androgens' },
        { preset: 'cah3b', watch: '17-OHP' },
      ],
    },
    {
      heading: 'Blood pressure and treatment are the two threads running through all of it',
      paragraphs: [
        'Two clinical threads run through all of this. The first is blood pressure: it falls when mineralocorticoids are lost and rises when DOC accumulates, so the same family of enzyme defects produces both salt-losing collapse and early hypertensive disease depending only on WHERE the block sits. The second is treatment as diagnosis: giving hydrocortisone suppresses the ACTH drive fuelling precursor accumulation, so the biochemistry of a treated patient tells you about compliance before it tells you about genetics — watch the treated preset hold normal crisis risk while its endogenous cortisol remains collapsed.',
      ],
    },
    {
      heading: 'Read the four presets side by side and the matrix teaches itself',
      paragraphs: [
        'Read the four presets side by side and the matrix teaches itself: cortisol down in all of them; mineralocorticoid low only where neither DOC nor replacement rescues it; androgens up in 21 and 11, absent in 17 and 3β; hypertension in exactly the two DOC-rich blocks; and 17-OHP high ONLY in 21-hydroxylase. Boards ask this matrix constantly because it is pure logic once the pathway diagram is in your head — and dangerous to guess, because the presentations overlap at the bedside while the biochemistry never does.',
      ],
      demos: [
        { preset: 'cah21SaltWasting' },
        { preset: 'cah11' },
        { preset: 'cah17' },
        { preset: 'cah3b' },
      ],
    },
  ],
};
