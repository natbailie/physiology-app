import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { ImmunePresetName } from './engine/presets';

export const immuneResponseContent: ExplainerContent<ImmunePresetName> = {
  title: 'Why the second exposure is nothing like the first',
  sections: [
    {
      heading: 'A primary response is slow for a structural reason',
      paragraphs: [
        'A primary response is slow for a structural reason. Innate immunity — neutrophils, macrophages, complement — is active within hours, but it is fixed and non-specific, and it can only slow an organism down, not clear it. Meanwhile dendritic cells must sample antigen, migrate to a lymph node, and find the one naive lymphocyte in millions that happens to recognise it. That search takes days, and the pathogen is replicating exponentially throughout. Almost everything that makes a first infection an illness happens during that delay.',
      ],
      demos: [
        { preset: 'healthyHost', watch: 'pathogen load' },
      ],
    },
    {
      heading: 'Helper T cells are the hub both arms turn on',
      paragraphs: [
        'Helper T cells are the hub the whole adaptive system turns on. They license cytotoxic T cells to kill infected cells, and they supply the second signal B cells need to switch class from IgM to the far more potent IgG. Because one cell type gates both arms, losing it takes out cellular and humoral immunity simultaneously — which is exactly why CD4 count predicts opportunistic infection in HIV so well. Compare the HIV preset with the B-cell deficiency preset and watch the difference: the B-cell defect leaves cytotoxic killing perfectly intact, whereas CD4 depletion flattens both.',
      ],
      demos: [
        { preset: 'hivCd4Depletion', watch: 'pathogen load' },
      ],
    },
    {
      heading: 'Which arm matters depends on where the organism hides',
      paragraphs: [
        'Which arm actually matters depends on where the organism hides. Antibody neutralises pathogens in the extracellular space but cannot reach inside a host cell, so an intracellular organism has to be dealt with by cytotoxic T cells killing the infected cell itself. Switch the pathogen type and you change which deficiency is dangerous, not merely how sick the host gets.',
      ],
      demos: [
        { preset: 'intracellularPathogen', watch: 'cytotoxic T cells' },
        { preset: 'neutropenia', watch: 'pathogen load' },
      ],
    },
    {
      heading: 'The antibody isotypes are a clock as much as a mechanism',
      paragraphs: [
        'The antibody isotypes are a clock as much as a mechanism. IgM is produced first because it needs no class switching; IgG requires the switch, and the switch requires helper T cell support, so it necessarily lags. That ordering is why serology can date an infection rather than merely detect it — IgM suggests a recent or current encounter, IgG a past one or an established response. And it is why a memory response looks qualitatively different on the lab report: it produces IgG almost immediately, skipping the IgM phase a naive host has to go through.',
      ],
      demos: [
        { preset: 'bCellDeficiency', watch: 'IgG' },
      ],
    },
    {
      heading: 'Vaccination exploits a gap in what the system can distinguish',
      paragraphs: [
        'Vaccination works by exploiting a gap in what the immune system can distinguish. The adaptive arm responds to antigen, not to damage, so an antigen delivered without a replicating organism drives the same presentation, the same helper T licensing, the same class switching and the same memory formation. The host pays the cost of a primary response at a moment of its choosing, when nothing is dividing exponentially in the background. Set the vaccine antigen here and then infect, and compare the curves against infecting a naive host — the difference is entirely in the timing.',
      ],
    },
    {
      heading: 'Memory removes the search delay and raises the starting number',
      paragraphs: [
        'Memory is the payoff, and here it emerges from the model rather than being scripted. Surviving an infection leaves a persistent population of memory cells, which does two things: it removes the search delay, and it raises the number of antigen-specific precursors so the response is bigger as well as faster. Clear an infection, then infect the same host again — the organism barely grows before it is met, clearance takes a fraction as long, and there is essentially no fever. Vaccination reaches the identical end state by a shorter road: antigen without a replicating organism, so memory forms and the host is never ill at all.',
      ],
      demos: [
        { preset: 'transplantImmunosuppression', watch: 'pathogen load' },
      ],
    },
  ],
};
