import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const respiratoryContent: ExplainerContent = {
  title: 'How breathing and the kidneys defend blood pH',
  paragraphs: [
    'Blood pH depends on the ratio of bicarbonate (HCO3-, kidney-controlled) to CO2 (lung-controlled): pH = 6.1 + log10(HCO3-/(0.03 × PaCO2)). Either organ can push pH off target; the other compensates.',
    'Chemoreceptors sense rising CO2, falling pH, or — only once quite low — falling oxygen, and adjust ventilation within seconds to minutes. This is why Kussmaul breathing appears in DKA: the lungs are compensating for a metabolic acid load, not the primary problem.',
    'Sustained CO2 or pH derangement also triggers slow renal compensation (days): the kidneys generate or excrete bicarbonate to partially normalize pH. This is why chronic COPD can show a near-normal pH despite a persistently high PaCO2, while an acute panic attack’s respiratory alkalosis remains uncompensated.',
    'Oxygen delivery depends on PaO2 (set by inspired O2 and ventilation) and how that maps to hemoglobin saturation via the S-shaped O2-Hb dissociation curve — small PaO2 drops below about 60 mmHg cause disproportionately large SaO2 drops.',
  ],
};
