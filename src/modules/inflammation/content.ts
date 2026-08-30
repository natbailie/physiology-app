import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { InflammationPresetName } from './engine/presets';

export const inflammationContent: ExplainerContent<InflammationPresetName> = {
  title: 'The acute response: from first minutes to resolution',
  sections: [
    {
      heading: 'The first minutes are mediators, not cells',
      paragraphs: [
        'Inflammation begins the moment tissue damage is detected. Mast cells release histamine within seconds; prostaglandins and bradykinin follow within minutes. The result is vasodilation (rubor, calor), increased vascular permeability (tumour), and nociceptor sensitisation (dolor) — the four cardinal signs that Hippocrates described and that this module models as a single mediator wave rising from the insult.',
      ],
      demos: [
        { preset: 'normal', watch: 'mediators' },
        { preset: 'acuteCellulitis', watch: 'histamine' },
      ],
    },
    {
      heading: 'Neutrophils arrive over hours as the first cellular line',
      paragraphs: [
        'Neutrophils arrive next, recruited from the marginated pool and then from the marrow over six to twenty-four hours. They are the first line of cellular defence against bacteria: phagocytosis, degranulation, and the respiratory burst. The neutrophil count on a blood test climbs hours before the CRP does, which is why a normal white cell count at presentation excludes neither infection nor its early severity.',
      ],
      demos: [
        { preset: 'severeBacterialLoad', watch: 'neutrophils' },
        { preset: 'abscessFormation', watch: 'neutrophils' },
      ],
    },
    {
      heading: 'Macrophages are slower to arrive and far more persistent',
      paragraphs: [
        'Monocytes follow a day or two later and differentiate into macrophages — slower to arrive but far more persistent. Where neutrophils burn bright and die, macrophages orchestrate the longer campaign: phagocytosing debris, presenting antigens to the adaptive immune system, and driving the transition from acute to chronic inflammation if the insult proves intractable. The macrophage handover is what makes resolution possible.',
      ],
    },
    {
      heading: 'CRP lags the signal by hours and falls on its own half-life',
      paragraphs: [
        'CRP is a hepatic acute-phase protein whose synthesis is driven by interleukin-6. It lags the local cytokine signal by hours, peaks around forty-eight to seventy-two hours, and falls with a half-life of roughly nineteen hours once the stimulus is removed. A CRP that is still climbing at day three tells you the fight is not yet won; one that is falling tells you it is. Serial CRP is the bedside test for whether treatment is working.',
      ],
    },
    {
      heading: 'What the insult is decides everything that follows',
      paragraphs: [
        'What the insult IS decides everything. Bacteria multiply and must be killed; crystals dissolve slowly on their own; a foreign body cannot be degraded at all and turns the response chronic. Antibiotics help only against bacteria — adding them to a crystal-driven flare changes nothing. Source control (drainage, debridement) does what no drug can when pus has collected behind an avascular wall.',
      ],
      demos: [
        { preset: 'goutFlare', watch: 'bacterial load' },
        { preset: 'foreignBodySuture', watch: 'resolution' },
      ],
    },
    {
      heading: 'Steroids are the pharmacological paradox of inflammation',
      paragraphs: [
        'Steroids are the pharmacological paradox of inflammation. They suppress every arm — vasodilation, mediator release, neutrophil recruitment, CRP synthesis — making the patient look dramatically better while potentially letting the underlying infection run unchecked. This is why steroids over infection is a clinical emergency: the signs are masked but the disease is not treated. Steroids work in autoimmunity and allergy precisely because there is no living pathogen to unmask.',
      ],
      demos: [
        { preset: 'steroidsOverInfection', watch: 'bacterial load' },
        { preset: 'immunosuppressedSmoulder', watch: 'CRP' },
      ],
    },
  ],
};
