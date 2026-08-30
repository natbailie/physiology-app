import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CellCyclePresetName } from './engine/presets';

export const cellCycleContent: ExplainerContent<CellCyclePresetName> = {
  title: 'The cycle runs on schedule until a checkpoint decides otherwise',
  sections: [
    {
      heading: 'Most of the cycle is preparation rather than division',
      paragraphs: [
        'The cell cycle is four phases on a clock: G1 (growth and preparation, roughly eleven hours in a fast human cell), S (DNA synthesis, eight), G2 (pre-mitotic checking, four) and M (mitosis itself, one). Notice the proportions — most of the cycle is not division but the disciplined preparation for it, which is why most chemotherapy targets things happening outside mitosis. The ring here shows where a tracked cohort currently sits; the durations are textbook values and every transition is gated by the same checkpoints the real machinery uses.',
      ],
      demos: [
        { preset: 'normal', watch: 'phase' },
      ],
    },
    {
      heading: 'Three checkpoints do nearly all the regulatory work',
      paragraphs: [
        'Three checkpoints do nearly all the regulatory work. The restriction point at G1/S asks: is there enough growth signal, and is the genome clean enough, to commit to replication? Committing is expensive — once past it, the cell usually finishes the cycle. The G2/M checkpoint re-inspects the genome before investing in mitosis, and the spindle assembly CHECKPOINT in M refuses to let chromatids separate until every chromosome is properly bi-oriented. Each checkpoint exists because the error it prevents is catastrophic: replicating damaged DNA, dividing a broken genome, or splitting copies unevenly.',
      ],
      demos: [
        { preset: 'quiescent', watch: 'phase' },
      ],
    },
    {
      heading: 'p53 arrests first and executes only when repair cannot win',
      paragraphs: [
        'p53 is the genome\'s guardian, and its logic is worth internalising as a decision tree. Above a threshold of DNA damage, functional p53 halts the cycle at G1/S and G2/M — buying time for repair. If the damage exceeds what repair can address, p53 switches from arresting to executing: apoptosis. That is why radiotherapy works: it loads tumour cells with lesions and intact-p53 cells eliminate themselves. Now remove p53 — the commonest single gene lesion in human cancer — and both arms fail simultaneously: no arrest, so damaged genomes replicate on schedule; no execution, so nothing is culled. Run the irradiated and TP53-lost presets side by side and watch one population park while the other sails through.',
      ],
      demos: [
        { preset: 'irradiated', watch: 'arrest' },
        { preset: 'tp53Mutated', watch: 'damaged divisions' },
      ],
    },
    {
      heading: 'Losing RB jams the gate open rather than removing a signal',
      paragraphs: [
        'RB1 loss breaks the cycle differently. The restriction point is not really about sensing growth factors — it is about RB holding E2F shut. Mitogens work through cyclin D to phosphorylate RB and free E2F. Lose RB entirely and the gate is jammed open: cells enter S with no growth signal whatsoever, which is autonomy in the literal sense — the defining property of a tumour. Note the model will not let an RB-null cell enter quiescence however starved you make it, and that refusal IS the oncology.',
      ],
      demos: [
        { preset: 'rbLost', watch: 'phase' },
        { preset: 'oncogeneActive', watch: 'phase' },
      ],
    },
    {
      heading: 'The phase a drug arrests in identifies its class',
      paragraphs: [
        'Drugs map onto checkpoints with beautiful precision, and the phase of arrest identifies the drug class. Taxanes freeze microtubules so the spindle never forms properly — cells pile up at the spindle assembly checkpoint in M. Hydroxyurea blocks ribonucleotide reductase so synthesis stalls — accumulation in S. CDK4/6 inhibitors (palbociclib-class) pharmacologically recreate what RB does, jamming the restriction point even under full oncogenic drive — which is exactly why they work in RB-intact tumours and fail when RB is gone. Read the arrest badge on the ring: "where the pile-up happens" is the exam question and the mechanism in one.',
      ],
      demos: [
        { preset: 'taxaneArrest', watch: 'phase' },
        { preset: 'hydroxyurea', watch: 'phase' },
        { preset: 'cdk46Inhibited', watch: 'phase' },
      ],
    },
    {
      heading: 'Proliferation is a decision made repeatedly, not a default',
      paragraphs: [
        'One habit to carry away: proliferation is a decision made repeatedly, not a default state. Quiescence (G0) is reversible and harmless; senescence and apoptosis are the irreversible exits; transformation is what you call a cell that has lost the ability to take any exit. Every cancer treatment short of surgery works by pushing cycling cells toward one of those exits or trapping them in one of these checkpoints — so knowing which checkpoint a tumour still owns tells you which drugs can possibly work.',
      ],
    },
  ],
};
