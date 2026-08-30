import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { PregnancyPresetName } from './engine/presets';

export const pregnancyContent: ExplainerContent<PregnancyPresetName> = {
  title: 'Every maternal number changes, and most of the changes look like disease',
  sections: [
    {
      heading: 'Almost every change mimics pathology until you know why',
      paragraphs: [
        'Pregnancy rewires the mother systematically, and almost every change mimics pathology until you know its mechanism. Plasma volume expands by up to forty-five per cent while red cell mass gains only twenty-five — so haemoglobin concentration falls to around 11 g/dL despite the bone marrow making more cells than ever. That is physiological dilution, worst near 30 weeks, and it is why treating a healthy pregnant woman\'s Hb of 10.8 as iron deficiency needs more than the number alone. Cardiac output climbs toward forty per cent above baseline; systemic vascular resistance falls under gestational vasodilatation, giving the mid-trimester blood pressure dip that pre-eclampsia later reverses.',
      ],
      demos: [
        { preset: 'firstTrimester', watch: 'haemoglobin' },
        { preset: 'normalTerm', watch: 'plasma volume' },
      ],
    },
    {
      heading: 'Progesterone is the great physiologic driver',
      paragraphs: [
        'Progesterone is the great physiologic driver. It stimulates hyperventilation from the first trimester, dropping PaCO2 to about 30 mmHg at term — a chronic respiratory alkalosis the kidney pays for by dumping bicarbonate to around 20 mmol/L, holding pH barely alkalaemic at 7.44. Read a pregnant woman\'s gas with non-pregnant reference ranges and she looks like she is hyperventilating from anxiety; read it knowing progesterone and she is perfectly compensated. The same hormone relaxes smooth muscle everywhere (constipation, reflux, ureteric dilatation) and raises GFR by half, which is why a normal pregnancy creatinine of 0.5 mg/dL would represent renal failure in anyone else.',
      ],
      demos: [
        { preset: 'lateSecondTrimester', watch: 'PaCO2' },
      ],
    },
    {
      heading: 'The placenta runs both sides, so its failure is coherent',
      paragraphs: [
        'The placenta runs both sides of the exchange, so its failure produces a coherent syndrome rather than scattered findings. Placental insufficiency restricts fetal growth along the cubic weight curve while the malplacentated uterus releases anti-angiogenic and vasoconstrictor signals — SVR rises, pressure rises, the mother risks eclampsia while her fetus starves. Compare the pre-eclampsia preset against normal term: the same week of gestation, an entirely different cardiovascular picture. The fetus takes what it can regardless — uteroplacental flow grows toward a fifth of cardiac output — which is why maternal collapse spares neither.',
      ],
      demos: [
        { preset: 'preEclampsiaIugr', watch: 'fetal weight' },
        { preset: 'twins', watch: 'plasma volume' },
      ],
    },
    {
      heading: 'Labour is the textbook positive-feedback loop',
      paragraphs: [
        'Labour is the textbook positive-feedback loop. Cervical stretch drives oxytocin release; oxytocin drives contractions; contractions drive stretch. Run the labour onset action and watch dilation accelerate — slow centimetres early, rapid ones late — because each centimetre strengthens the signal for the next. This is also why the reflex has a pharmacological handle: exogenous oxytocin augments exactly this loop, and the fetal head delivering breaks it.',
      ],
    },
    {
      heading: 'Lactation is two hormones pulling one lever',
      paragraphs: [
        'Lactation explains itself through two hormones pulling one lever. Prolactin rises all pregnancy, priming the gland, but progesterone blocks secretory activation — which is why milk does not come in at delivery but on day two or three, when the placenta\'s progesterone has fallen away and prolactin is suddenly unopposed. After that, supply belongs entirely to suckling: prolactin is maintained BY nipple stimulation, not by stores, so demand regulates production (and an unsuckled breast involutes within days). Oxytocin\'s role is mechanical — the let-down reflex that ejects milk — and it fires within seconds of a feed, which is why watching this module\'s oxytocin trace during a simulated suckle teaches the difference between making milk and moving it.',
      ],
      demos: [
        { preset: 'postpartumFeeding', watch: 'prolactin' },
        { preset: 'postpartumNoFeed', watch: 'prolactin' },
      ],
    },
  ],
};
