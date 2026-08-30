import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { DigestionPresetName } from './engine/presets';

export const digestionAbsorptionContent: ExplainerContent<DigestionPresetName> = {
  title: 'The meal, taken apart and taken up',
  sections: [
    {
      heading: 'Absorption is a chain, and it fails at its weakest link',
      paragraphs: [
        'Absorption is a chain, and a chain fails at whichever link is weakest. The pancreas delivers the hydrolytic machinery, the liver and gallbladder deliver the detergent, the brush border finishes what both started, and only then does a working surface carry the products away. Press Eat a meal on the healthy preset and every link lights up: fat disappears into the wall, lactose vanishes at the brush border, and the stool barely notices anything happened. Every disease in this module is that same meal with one link broken — which is why the stool can name the broken link for you.',
      ],
      demos: [
        { preset: 'normal', watch: 'nutrition' },
        { preset: 'pancreaticInsufficiency', watch: 'fat absorption' },
      ],
    },
    {
      heading: 'Fat needs two accessories before the wall can touch it',
      paragraphs: [
        'Fat is the strictest of the macronutrients because it needs two accessories before the wall can touch it. Bile salts emulsify; pancreatic lipase cuts; either failing alone leaves the triglyceride untouched and heading for the colon as hydroxylated fatty acids, which are not just lost but actively secretory — they water the colon directly. Notice too how much reserve the pancreas carries: cut enzyme capacity to fifteen per cent and absorption is still complete, because health holds roughly ten times what a meal demands. Steatorrhoea appearing means nine tenths of the machinery is already gone.',
      ],
      demos: [
        { preset: 'shortBowelSyndrome', watch: 'fat absorption' },
      ],
    },
    {
      heading: 'The bile salt pool is an economy, and it explains two diarrhoeas',
      paragraphs: [
        'The bile salt pool is an economy. The liver makes a few grams a day at most, the ileum reclaims ninety-eight per cent of every cycle, and the difference between loss and synthesis is the pool itself. That accounting explains two very different diarrhoeas from one lesion. Resect the terminal ileum entirely and the pool bleeds out within days: no detergent, so fat malabsorption joins in, while B12 — absorbed through those same vanished cells — starts its slow years-long decline toward deficiency. Lose only part of the ileum and synthesis keeps the pool alive, but grams of salt now spill into the colon each day and water it directly: cholerrhoea, a watery diarrhoea driven by the detergent that escaped.',
      ],
      demos: [
        { preset: 'partialIlealLoss', watch: 'bile salt pool' },
        { preset: 'terminalIlealResection', watch: 'fat absorption' },
      ],
    },
    {
      heading: 'Osmotic and secretory diarrhoea are different machines',
      paragraphs: [
        'Osmotic and secretory diarrhoea are different machines, and the model separates them the way the bedside test does. Unabsorbed lactose holds water by osmosis all the way out — stop the milk and it stops, and the stool osmotic gap runs high because the water was held by particles no electrolyte accounts for. A VIP-like drive secretes whether or not anyone eats; fasting changes nothing and the gap stays low. Between meals, watch the lactase-deficient gut settle back to quiet while the secretory one keeps pouring: that single contrast is most of the clinical reasoning in chronic diarrhoea.',
      ],
      demos: [
        { preset: 'lactaseDeficiency', watch: 'stool osmotic gap' },
        { preset: 'vipoma', watch: 'stool output' },
      ],
    },
    {
      heading: 'Site specificity is what turns anatomy into diagnosis',
      paragraphs: [
        'Site specificity turns anatomy into diagnosis. Iron, calcium and folate are taken up proximally, so coeliac disease — an upper-gut lesion — starves them first while B12 rides past untouched. Ileal Crohn\'s does the opposite. The colon is the last reserve: presented with a secretory load it can reclaim litres before stool becomes liquid, which is why the same drive produces annoyance in one patient and collapse in another whose colon has been resected or is itself inflamed.',
      ],
      demos: [
        { preset: 'coeliacDisease', watch: 'iron absorption' },
      ],
    },
    {
      heading: 'The micronutrient reserves empty long before the weight does',
      paragraphs: [
        'Finally, the long game. Macro absorption may limp along at levels a patient barely notices while the micronutrient reserves — iron over months, B12 over years — quietly empty toward deficiency. The nutrition readout drifts toward whatever absorption actually delivers, which is why weight loss and anaemia so often announce a gut disease the gut itself never complained about.',
      ],
    },
  ],
};
