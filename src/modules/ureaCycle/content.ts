import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { UreaCyclePresetName } from './engine/presets';

export const ureaCycleContent: ExplainerContent<UreaCyclePresetName> = {
  title: 'Why urea falls when the liver fails and ammonia is what rises instead',
  sections: [
    {
      heading: 'One balance — nitrogen in against cycle capacity — drives everything',
      paragraphs: [
        'Every number in this module hangs off a single balance: the nitrogen load presented to the liver against the urea cycle capacity available to clear it. The load arrives from two directions that the sliders keep deliberately separate, because a learner must stop equating nitrogen with food. Dietary protein is the obvious half, roughly sixteen percent nitrogen by mass, but catabolic stress is the quieter one — a gastrointestinal bleed, trauma or sepsis digests the patient from the inside, delivering a steak-sized nitrogen load with nothing eaten at all. Capacity is the product of two further sliders for the same reason: functioning hepatocyte mass and residual enzyme activity multiply, so cirrhosis and an inherited defect injure the same balance through different doors, and the diagram draws both as calibre on the arrows they throttle.',
      ],
      demos: [
        { preset: 'highProtein', watch: 'urea' },
        { preset: 'giBleed', watch: 'nitrogen load' },
      ],
    },
    {
      heading: 'While capacity covers the load, urea is the signal and ammonia stays flat',
      paragraphs: [
        'A healthy cycle defends ammonia the way a healthy pancreas defends glucose: the moment more nitrogen arrives, more urea leaves, and the toxic substrate barely moves. Drag the protein slider from an ordinary dinner to a bodybuilder excess and watch the two readouts diverge — urea more than doubles while ammonia stays inside the tolerated range, because CPS1 through arginase simply run faster. That flat ammonia line is the whole point of having a cycle rather than a passive filter, and it is why a raised urea in a well person is usually a catering observation rather than a liver observation. The urine nitrogen tile confirms the accounting directly, tracking intake gram for gram at balance, which is the nitrogen-balance concept dietetics examinations keep asking after dressed in different units.',
      ],
      demos: [
        { preset: 'highProtein', watch: 'ammonia' },
        { preset: 'normal', watch: 'urine nitrogen' },
      ],
    },
    {
      heading: 'When capacity fails, the product disappears with the function',
      paragraphs: [
        'Liver failure inverts the healthy picture, and the inversion is the diagnostic trap the module exists to plant. Reduce functioning mass to a quarter and the same ordinary dinner now drives ammonia past the encephalopathic threshold while urea collapses to a fraction of its baseline — the product disappears precisely because the failing step is the one that manufactures it. A learner who reads a low urea as reassuring has the physiology exactly backwards: in a cirrhotic patient a falling urea beside a rising ammonia is the cycle confessing. The encephalopathy grade tile makes the clinical payoff explicit, stepping from awake through four grades as ammonia crosses the thresholds wards actually act on, which is why ammonia is drawn large and urea beside it rather than the other way round.',
      ],
      demos: [
        { preset: 'liverFailure', watch: 'ammonia' },
        { preset: 'liverFailure', watch: 'urea' },
      ],
    },
    {
      heading: 'The orotic shunt separates two failures that share an ammonia',
      paragraphs: [
        'An OTC defect and cirrhosis can present with nearly identical ammonia and urea numbers, and the orotic shunt is the one reading that refuses to confuse them. When CPS1 still runs against a distal block, carbamoyl-phosphate accumulates with nowhere downstream to go and spills sideways into orotic acid — so the inherited defect pairs hyperammonaemia with a brisk orotate while the failing liver, whose entry step is itself dying, shows none. The diagram draws this as a relief valve above the blocked station that opens only when the block is distal, which mirrors the biochemistry closely enough to reason from: orotic aciduria with hyperammonaemia points downstream of CPS1, and its absence points at the entry or at the whole organ. Valproate sits instructively between the two, blocking the entry step pharmacologically with a milder shunt than a true OTC defect, the way drug histories sit between genes and organs in a real clerking.',
      ],
      demos: [
        { preset: 'otcDeficiency', watch: 'orotic shunt' },
        { preset: 'valproateBlock', watch: 'orotic shunt' },
      ],
    },
    {
      heading: 'Hydration concentrates the urea without touching the ammonia',
      paragraphs: [
        'The hydration slider is the module honesty check: it moves urea and BUN while leaving ammonia essentially untouched, because concentration is not production. A dry patient concentrates whatever urea the liver made, so BUN rises for renal reasons with the nitrogen balance itself unchanged — the prerenal pattern wards recognise, drawn here as a narrowing exit arrow rather than a busier cycle. The teaching value is entirely in the dissociation: any manoeuvre that moves both numbers together is acting on the cycle, and anything that moves urea alone is acting on the water. Read the two tiles as a pair and the module has taught the single most useful habit in nitrogen interpretation, which is never to read urea without asking what the ammonia and the fluid balance are doing alongside it.',
      ],
      demos: [
        { preset: 'normal', watch: 'urea' },
      ],
    },
    {
      heading: 'The fumarate bridge is where this cycle meets the Krebs cycle',
      paragraphs: [
        'The urea cycle does not end at arginine: argininosuccinate lyase releases fumarate alongside it, and that fumarate runs through malate to oxaloacetate and back to the aspartate the cycle consumed — the aspartate-argininosuccinate shunt, sometimes called the Krebs bicycle, that couples nitrogen disposal to mitochondrial energetics. The diagram labels the bridge rather than simulating it, because each module owns one cycle and the coupling belongs to both lessons at once. Follow it in the other direction and the connection explains itself: a starving mitochondrion short of oxaloacetate donates less aspartate, and a urea cycle turning fast delivers more fumarate to burn. Open the Krebs module beside this one and the two arrows meet in the middle, which is exactly how the pathways meet in the hepatocyte.',
      ],
      demos: [
        { preset: 'otcDeficiency', watch: 'ammonia' },
      ],
    },
  ],
};
