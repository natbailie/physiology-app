import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MembranePresetName } from './engine/presets';

export const membranePotentialsContent: ExplainerContent<MembranePresetName> = {
  title: 'How ion gradients become an all-or-nothing signal',
  sections: [
    {
      heading: 'The membrane sits nearest whichever ion is most permeant',
      paragraphs: [
        'Each ion has an equilibrium potential given by the Nernst equation — the voltage at which its concentration gradient is exactly balanced by the electrical gradient (about −95 mV for K+, +61 mV for Na+). Membrane potential always sits nearest the equilibrium potential of whichever ion the membrane is currently most permeable to. At rest that is potassium, via leak channels, which is why resting potential lands near E_K and why extracellular potassium is its strongest determinant.',
      ],
      demos: [
        { preset: 'normal', watch: 'resting potential' },
      ],
    },
    {
      heading: 'Three voltage-gated processes running at different speeds',
      paragraphs: [
        'The action potential comes from three voltage-gated processes running at different speeds. Sodium activation (m) opens fastest, so depolarization past threshold lets Na+ rush in and depolarize further — a regenerative loop that produces the steep upstroke. Sodium inactivation (h) closes more slowly, shutting the sodium current off from behind, while the delayed-rectifier potassium gate (n) opens slowest and drives repolarization. That staggering of time constants, not any single channel, is the entire mechanism.',
      ],
    },
    {
      heading: 'Slow recovery of inactivation is why hyperkalaemia deceives',
      paragraphs: [
        'Because h takes time to recover, a cell that has just fired cannot fire again — the refractory period. This is also why hyperkalemia is deceptive: raising extracellular K+ moves E_K toward zero and depolarizes the resting membrane, which brings the cell closer to threshold but simultaneously leaves a large fraction of its sodium channels already inactivated. The net effect is reduced excitability despite sitting closer to firing.',
      ],
      demos: [
        { preset: 'hyperkalemia', watch: 'excitability' },
      ],
    },
    {
      heading: 'How fast it travels is a separate question from whether it fires',
      paragraphs: [
        'How fast the signal travels is a separate question from whether it can be generated at all, and separating the two explains a lot of neurology. Myelination is the dominant term: saltatory conduction between nodes of Ranvier makes a myelinated fibre roughly an order of magnitude faster than an unmyelinated one of identical diameter. Sodium availability matters too, since each node must deliver enough inward current to bring the next one to threshold. Demyelination therefore slows or blocks propagation while leaving the axon perfectly capable of firing — a conduction problem, not an excitability problem.',
      ],
      demos: [
        { preset: 'demyelination', watch: 'conduction velocity' },
      ],
    },
    {
      heading: 'Temperature acts on every gate at once through one Q10',
      paragraphs: [
        'Temperature acts on everything at once, through the same Q10 that governs every gate. Cooling slows activation, inactivation and recovery together, so the action potential broadens, the refractory period lengthens and conduction velocity falls — all without changing a single concentration or equilibrium potential. This is why hypothermia is genuinely electrically different rather than simply slower, and why rewarming is part of treating its arrhythmias rather than an afterthought.',
      ],
      demos: [
        { preset: 'hypothermia', watch: 'conduction velocity' },
      ],
    },
    {
      heading: 'Drugs and disease map cleanly onto these parameters',
      paragraphs: [
        'Drugs and disease map cleanly onto these parameters. Local anesthetics and class I antiarrhythmics block sodium channels, abolishing the upstroke; class III antiarrhythmics block potassium channels, delaying repolarization and prolonging both the action potential and the refractory period. Cooling slows every gate through the same Q10 relationship, prolonging the spike and slowing conduction. Demyelination is different in kind — the axon still fires perfectly well, but saltatory conduction collapses, so this is a conduction problem rather than an excitability one.',
      ],
      demos: [
        { preset: 'localAnesthetic', watch: 'upstroke' },
        { preset: 'potassiumBlocker', watch: 'action potential duration' },
      ],
    },
  ],
};
