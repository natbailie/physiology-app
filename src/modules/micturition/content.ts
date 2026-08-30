import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MicturitionPresetName } from './engine/presets';

export const micturitionContent: ExplainerContent<MicturitionPresetName> = {
  title: 'Bladder filling, storage and the micturition reflex',
  sections: [
    {
      heading: 'A reservoir that fills continuously and reports its stretch',
      paragraphs: [
        'The bladder is a distensible reservoir that fills continuously via ureteric inflow at roughly 1–2 mL/min. As the detrusor muscle stretches, stretch receptors fire with increasing frequency, sending afferent signals via the pelvic nerve to the sacral micturition centre. The conscious sensation of fullness arrives well before the reflex threshold — the first desire at roughly 150–200 mL, a strong urge at 300–400 mL.',
      ],
      demos: [
        { preset: 'normal', watch: 'bladder volume' },
        { preset: 'filling', watch: 'bladder volume' },
      ],
    },
    {
      heading: 'Storage is sympathetic outflow holding the outlet closed',
      paragraphs: [
        'Storage depends on the sympathetic outflow via the hypogastric nerve: it relaxes the detrusor and contracts the internal urethral sphincter, keeping the bladder compliant and the outlet closed. Simultaneously, the external urethral sphincter — skeletal muscle under voluntary control via the pudendal nerve — provides the additional closure needed to resist sudden increases in abdominal pressure.',
      ],
      demos: [
        { preset: 'strongUrge', watch: 'detrusor pressure' },
      ],
    },
    {
      heading: 'Voiding is a coordinated reflex, not a single command',
      paragraphs: [
        'Voiding is a coordinated reflex. When afferent firing reaches threshold and the cortex gives permission, the pontine micturition centre fires: parasympathetic efferents via the pelvic nerve contract the detrusor, sympathetic tone is withdrawn, and the sphincters relax. The result is a high-pressure, low-resistance outflow that empties the bladder in a sustained contraction lasting 20–30 seconds.',
      ],
      demos: [
        { preset: 'voiding', watch: 'detrusor pressure' },
      ],
    },
    {
      heading: 'The cortex is the final arbiter over the pontine centre',
      paragraphs: [
        'The cortex is the final arbiter. Voluntary contraction of the external sphincter — the "squeeze" — inhibits the pontine centre and can defer voiding indefinitely. Conversely, cortical facilitation can initiate micturition even at sub-threshold volumes. This is why stress, habit and anxiety can all provoke urgency in the absence of bladder pathology.',
      ],
    },
    {
      heading: 'Urge and stress incontinence are opposite problems',
      paragraphs: [
        'Detrusor overactivity is the commonest cause of urge incontinence: involuntary contractions at volumes well below the normal threshold, driven by an over-sensitive afferent system or loss of cortical inhibition. Stress incontinence is the opposite problem — the detrusor is quiet but the sphincter cannot generate enough closing pressure to resist abdominal spikes. Overflow incontinence arises when the detrusor is too weak to contract at all, leaving the bladder to fill beyond capacity until passive leakage occurs.',
      ],
      demos: [
        { preset: 'detrusorOveractivity', watch: 'detrusor pressure' },
        { preset: 'stressIncontinence', watch: 'leak' },
        { preset: 'overflowIncontinence', watch: 'residual volume' },
      ],
    },
    {
      heading: 'The pattern of a neurogenic bladder depends on the lesion',
      paragraphs: [
        'Neurogenic bladder results from damage anywhere along the micturition pathway — spinal cord injury, multiple sclerosis, diabetes. The pattern depends on the lesion: a suprasacral lesion abolishes voluntary control while leaving the reflex intact (detrusor overactivity with dyssynergia); a sacral lesion abolishes the reflex entirely (underactive detrusor with overflow). Understanding which component is damaged predicts the urodynamic pattern.',
      ],
      demos: [
        { preset: 'neurogenic', watch: 'detrusor pressure' },
      ],
    },
  ],
};
