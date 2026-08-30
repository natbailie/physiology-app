import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { RespMechPresetName } from './engine/presets';

export const respiratoryMechanicsContent: ExplainerContent<RespMechPresetName> = {
  title: 'Reading spirometry, and why shunt and dead space are not the same problem',
  sections: [
    {
      heading: 'Compliance and resistance fail in opposite directions',
      paragraphs: [
        'Compliance and resistance are independent properties, and they fail in opposite directions. Low compliance means a stiff lung that cannot be inflated far, so vital capacity falls — but it empties perfectly well, which is why the FEV1/FVC ratio stays normal or even rises. High resistance means a lung that fills normally but empties slowly, so the ratio collapses while vital capacity is broadly preserved. That single contrast — reduced FVC with a preserved ratio versus a reduced ratio — is how restrictive and obstructive patterns are told apart.',
      ],
      demos: [
        { preset: 'normal', watch: 'FEV1/FVC' },
        { preset: 'pulmonaryFibrosis', watch: 'vital capacity' },
      ],
    },
    {
      heading: 'The time constant is what explains air trapping',
      paragraphs: [
        'The R × C time constant explains air trapping. Expiration is passive and exponential, needing roughly three time constants to finish. Raise resistance and the lung needs longer; if the next breath arrives before emptying completes, volume stacks up breath after breath. This is why residual volume and FRC rise in obstruction (hyperinflation), and why breathing faster makes an obstructed patient worse rather than better — the treatment for dynamic hyperinflation is to slow the rate and lengthen expiration.',
      ],
      demos: [
        { preset: 'copd', watch: 'trapped volume' },
      ],
    },
    {
      heading: 'Surfactant is a separate route to a stiff lung',
      paragraphs: [
        'Surfactant is a separate route to a stiff lung. By Laplace\'s law (P = 2T/r), surface tension generates more collapsing pressure in smaller alveoli, so without surfactant small alveoli would empty into large ones. Surfactant\'s tension-lowering effect is strongest at small radii, which stabilizes alveoli against each other. Losing it — as in neonatal respiratory distress syndrome — produces restriction by a mechanism entirely distinct from fibrotic tissue stiffening.',
      ],
      demos: [
        { preset: 'neonatalRDS', watch: 'compliance' },
      ],
    },
    {
      heading: 'One ratio separates the two failure modes a volume cannot',
      paragraphs: [
        'The FEV1/FVC ratio is the single most useful number in spirometry because it separates the two failure modes that a volume alone cannot. Obstruction slows emptying, so less of the vital capacity escapes in the first second and the ratio falls. Restriction reduces the volume available but leaves the airways alone, so a smaller FVC empties at a normal proportional rate and the ratio is PRESERVED — sometimes even high. A low vital capacity therefore means nothing on its own; it is the ratio that says whether the problem is getting air out or getting it in.',
      ],
    },
    {
      heading: 'The flow-volume loop shows the same physiology as a shape',
      paragraphs: [
        'The flow-volume loop shows the same physiology as a shape, and the shapes are diagnostic. A normal expiratory limb rises to a sharp peak then falls almost linearly. An obstructed one cannot sustain flow at low lung volumes, because small airways collapse as the lung empties, giving the scooped concave limb that is obstruction\'s visual signature. A restricted loop keeps its normal shape and is simply narrower. There is a nasty corollary: because an obstructed lung needs roughly three time constants to empty, breathing faster shortens expiration below what it needs and traps more air each breath — the patient who is working harder is making it worse.',
      ],
    },
    {
      heading: 'Dead space and shunt behave oppositely, and only one defends',
      paragraphs: [
        'Dead space and shunt are both "V/Q mismatch" but behave oppositely, and only one has a defence. Dead space is ventilated but not perfused (V/Q → infinity), as in pulmonary embolism. Shunt is perfused but not ventilated (V/Q → 0), as in pneumonia or atelectasis. Hypoxic pulmonary vasoconstriction senses low alveolar oxygen and diverts blood away from poorly ventilated lung — which partially rescues a shunt. Against dead space it is completely powerless: there is no perfusion left in that unit to redirect. Set a shunt and watch HPV engage; set an equivalent dead space and watch it do nothing at all.',
      ],
      demos: [
        { preset: 'pulmonaryEmbolism', watch: 'dead space' },
        { preset: 'pneumonia', watch: 'shunt fraction' },
      ],
    },
  ],
};
