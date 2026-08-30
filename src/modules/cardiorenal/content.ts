import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { PresetName } from './engine/presets';

export const cardiorenalContent: ExplainerContent<PresetName> = {
  title: 'How the heart and kidneys hold pressure steady',
  sections: [
    {
      heading: 'Pressure is output times resistance, and every mechanism moves one',
      paragraphs: [
        'Mean arterial pressure is cardiac output multiplied by systemic vascular resistance, and every mechanism here works by moving one of those two terms. Cardiac output is itself heart rate times stroke volume, and stroke volume depends on how full the ventricle was when it started — so blood volume, which the kidney controls, ends up setting the pressure the heart generates. That is the loop: the heart supplies the kidney with perfusion, and the kidney supplies the heart with volume.',
      ],
      demos: [
        { preset: 'normal', watch: 'MAP' },
      ],
    },
    {
      heading: 'What separates the defences is how fast they act, not what they do',
      paragraphs: [
        'What separates the defences is not what they do but how fast they do it. Baroreceptors sense the pressure fall within a heartbeat and raise heart rate and vascular tone over seconds. RAAS takes minutes to hours, because it works by retaining salt and water rather than by squeezing what is already there. ANP answers over its own intermediate timescale. Each actuator in the model relaxes toward its target with its own time constant rather than snapping to it, which is both why the traces settle instead of oscillating and why the fast and slow responses stay visibly separate on the chart.',
      ],
    },
    {
      heading: 'Renin buys pressure two different ways on two different clocks',
      paragraphs: [
        'When pressure or filtration stays low, the kidney releases renin, and the resulting angiotensin II constricts vessels while aldosterone retains sodium and water. Both arms raise pressure, but by different routes and on different clocks — one changes the resistance term immediately, the other rebuilds the volume term over hours. When volume becomes excessive instead, stretched atria release ANP, which relaxes vessels and promotes salt and water loss. ANP and RAAS are close to exact opposites, and the balance between them is what the blood volume trace is really showing.',
      ],
      demos: [
        { preset: 'highSaltDiet', watch: 'blood volume' },
      ],
    },
    {
      heading: 'The kidney protects its own flow across a broad band',
      paragraphs: [
        'The kidney protects its own blood flow across a broad band of pressures. Renal autoregulation holds flow roughly constant between about 70 and 150 mmHg, falls off steeply below that band, and rises only modestly above it before the vessels run out of room. This is why a moderate fall in blood pressure produces almost no change in filtration — and why, once the pressure drops past the bottom of the plateau, filtration falls very fast indeed.',
      ],
      demos: [
        { preset: 'kidneyFailure', watch: 'GFR' },
      ],
    },
    {
      heading: 'Renal flow follows forward flow, not the pressure at the bedside',
      paragraphs: [
        'Renal blood flow depends on forward flow, not only on pressure, and this is the mechanism people miss. A failing heart diverts flow away from the kidneys even while peripheral vasoconstriction keeps the measured MAP normal. The number at the bedside looks reassuring while the organ is being starved, which is why a normal blood pressure is not evidence of adequate renal perfusion in heart failure.',
      ],
      demos: [
        { preset: 'heartFailure', watch: 'renal blood flow' },
      ],
    },
    {
      heading: 'Put those together and the cardiorenal syndrome follows',
      paragraphs: [
        'Put those together and the cardiorenal syndrome follows. A weak ventricle cannot use the extra volume RAAS retains, because the Frank-Starling relationship turns over: past a certain filling volume a poorly contractile heart pumps less, not more. So the retention that would rescue a haemorrhage instead accumulates as congestion, the pressure never fully normalises, and the kidney keeps signalling for more. Note the model here uses the MAP = CO x SVR shortcut; the Venous Return module is where that shortcut is unpacked into the two curves it hides.',
      ],
    },
  ],
};
