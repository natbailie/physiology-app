import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { GiPresetName } from './engine/presets';

export const gastrointestinalContent: ExplainerContent<GiPresetName> = {
  title: 'How the gut paces digestion to what you just ate',
  sections: [
    {
      heading: 'Three drives converge on one parietal cell',
      paragraphs: [
        'Gastric acid secretion converges on the parietal cell from three directions: direct vagal ACh, gastrin acting mostly indirectly through ECL-cell histamine release, and a smaller direct gastrin effect. That convergence is exactly why PPIs and H2 blockers differ in strength — a PPI blocks the H+/K+-ATPase itself, the shared final step no matter which stimulus drove it, while an H2 blocker only removes the histamine-mediated contribution and leaves ACh and direct gastrin partly able to keep acid flowing.',
      ],
      demos: [
        { preset: 'normalMeal', watch: 'acid output' },
        { preset: 'ppiTherapy', watch: 'acid output' },
        { preset: 'vagotomy', watch: 'acid output' },
      ],
    },
    {
      heading: 'The gut hormones are the gut reading the meal',
      paragraphs: [
        'Gut hormones are the gut reading the meal\'s composition and pacing itself accordingly: protein and distension drive gastrin, fat and protein drive CCK (which also slows gastric emptying so the small intestine isn\'t overwhelmed), and carbohydrate and fat drive the incretins GIP and GLP-1 — the reason oral glucose triggers more insulin release than the same glucose given intravenously.',
      ],
      demos: [
        { preset: 'highFatMeal', watch: 'CCK' },
      ],
    },
    {
      heading: 'Falling duodenal pH is a direct acid-base handoff',
      paragraphs: [
        'Falling duodenal pH as acidic chyme empties in is what triggers secretin, which drives pancreatic bicarbonate secretion to neutralize it — a direct acid-base handoff from stomach to duodenum, and a small-scale preview of the same buffering logic used throughout acid-base physiology.',
      ],
    },
    {
      heading: 'The pancreas is told food is coming before it arrives',
      paragraphs: [
        'The gut tells the pancreas that food is coming before the food arrives, and that is the incretin effect. K and L cells in the duodenum sense carbohydrate and fat and release GIP and GLP-1, which prime the beta cell ahead of the glucose itself. The consequence is measurable and initially surprising: oral glucose triggers substantially more insulin release than the identical amount of glucose given intravenously. The pancreas is not simply reacting to a blood level, it is being warned. This is the pathway that GLP-1 agonists exploit, and it connects this module directly to Glucose Regulation.',
      ],
    },
    {
      heading: 'Emptying is paced by the duodenum, not by the stomach',
      paragraphs: [
        'Emptying is paced by the duodenum rather than by the stomach, through a feedback loop that is easy to feel. Fat and protein arriving downstream drive CCK, and CCK slows gastric emptying in turn — the enterogastric reflex — so the small intestine never receives more than it can digest at once. Fat is both the strongest and the longest-acting brake, which is exactly why a fatty meal sits noticeably longer than an equivalent carbohydrate one. Watch the gastric volume trace with fat set high and then low: the stomach is being told when to let go.',
      ],
      demos: [
        { preset: 'fasting', watch: 'gastric emptying' },
      ],
    },
    {
      heading: 'Acid secretion is self-limiting until something bypasses the brake',
      paragraphs: [
        'Acid secretion is normally self-limiting: once gastric pH falls far enough, somatostatin brakes further gastrin release. A gastrinoma (Zollinger-Ellison syndrome) secretes autonomously and bypasses that brake entirely, which is also why chronic PPI therapy paradoxically raises gastrin — suppressing acid removes the very signal that would otherwise rein gastrin back in. Between meals, the migrating motor complex sweeps the fasting gut clear in interdigestive waves; eating interrupts it until the next fast begins.',
      ],
      demos: [
        { preset: 'gastrinoma', watch: 'gastrin' },
      ],
    },
  ],
};
