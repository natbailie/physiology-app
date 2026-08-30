import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MedullaPresetName } from './engine/presets';

export const adrenalMedullaContent: ExplainerContent<MedullaPresetName> = {
  title: 'Alpha raises it, beta moves everything else — and the order of blockade is the exam',
  sections: [
    {
      heading: 'A sympathetic neuron that lost its axon and secretes into the blood',
      paragraphs: [
        'The adrenal medulla is a postganglionic sympathetic neuron that lost its axon and learned to secrete into the blood instead. Its products run one synthesis line — tyrosine to L-dopa to dopamine to noradrenaline, with a final cortisol-dependent step (PNMT) converting noradrenaline to adrenaline inside the medulla. That PNMT detail explains a surgical fact: tumours sitting next to the cortisol-rich cortex secrete adrenaline; those outside it secrete noradrenaline. The secretory mix matters clinically, because noradrenaline works mostly on alpha (vasoconstriction, sustained pressure, pallor) while adrenaline adds beta effects (palpitations, anxiety, tremor, arrhythmia).',
      ],
      demos: [
        { preset: 'normal', watch: 'catecholamines' },
      ],
    },
    {
      heading: 'The tumour\'s secretory personality decides how it presents',
      paragraphs: [
        'Phaeochromocytoma presents as the tumour\'s secretory personality. Noradrenaline-predominant tumours hold the pressure up persistently, with headache and the classic contracted plasma volume — weeks of vasoconstriction leak volume away, so these patients drop their pressure dramatically on standing. Adrenaline-predominant tumours produce paroxysms of palpitations and panic over a less sustained pressure. The ten-percent rule of the old exams (bilateral, extra-adrenal, malignant, familial — MEN2, von Hippel-Lindau) reminds you where to look for the rest. Diagnosis runs through metanephrines because COMT methylates the catecholamines continuously whether they are spiking or not.',
      ],
      demos: [
        { preset: 'naPhaeochromocytoma', watch: 'blood pressure' },
        { preset: 'adPhaeochromocytoma', watch: 'heart rate' },
      ],
    },
    {
      heading: 'Block beta first and the pressure rises above what the tumour was making',
      paragraphs: [
        'Treatment sequencing is where this physiology becomes an exam question with real consequences. Block beta first and you have removed beta2 vasodilatation while leaving alpha vasoconstriction unopposed — pressure rises above what the untreated tumour was producing. Run the beta-first preset against the crisis preset and compare MAPs: the misprescribed patient is worse than the untreated one. Correct management is alpha-blockade first (phenoxybenzamine classically), letting the volume re-expand, then beta-blockade for reflex tachycardia once alpha is covered. Watch the properly blocked preset: same tumour, ordinary numbers, safe for surgery.',
      ],
      demos: [
        { preset: 'betaFirstError', watch: 'blood pressure' },
        { preset: 'properlyBlocked', watch: 'blood pressure' },
      ],
    },
    {
      heading: 'Paroxysms are events rather than states, and that changes the test',
      paragraphs: [
        'Paroxysms deserve their own attention because they are events, not states. A burst of secretion spikes pressure within seconds-to-minutes and clears with a half-life measured in minutes — which is why patients describe attacks rather than continuous illness, and why plasma metanephrines outperform random catecholamine sampling. Trigger the paroxysm action on an unblocked tumour and watch MAP spike; trigger the same on the alpha-covered preset and the surge flattens. Between paroxysms many patients are entirely normal, which is why the diagnosis waits in the community for years until someone thinks of it during an attack.',
      ],
      demos: [
        { preset: 'crisisUncontrolled', watch: 'blood pressure' },
      ],
    },
    {
      heading: 'Finding one should prompt the search for a syndrome',
      paragraphs: [
        'Finally, remember that the medulla sits ON top of the cortex, sharing a gland with three steroid-producing zones. Phaeochromocytoma can be the first presentation of familial disease — MEN2 with medullary thyroid carcinoma, von Hippel-Lindau, neurofibromatosis — so finding one should prompt the question of what else is hiding. And because PNMT is driven by cortisol bathing the medulla from the cortex, an adrenaline-secreting tumour is usually inside the gland while extra-adrenal paragangliomas almost always secrete noradrenaline alone. The anatomy predicts the biochemistry; the biochemistry predicts everything the monitors will show.',
      ],
    },
  ],
};
