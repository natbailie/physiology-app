import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const gastrointestinalContent: ExplainerContent = {
  title: 'How the gut paces digestion to what you just ate',
  paragraphs: [
    'Gastric acid secretion converges on the parietal cell from three directions: direct vagal ACh, gastrin acting mostly indirectly through ECL-cell histamine release, and a smaller direct gastrin effect. That convergence is exactly why PPIs and H2 blockers differ in strength — a PPI blocks the H+/K+-ATPase itself, the shared final step no matter which stimulus drove it, while an H2 blocker only removes the histamine-mediated contribution and leaves ACh and direct gastrin partly able to keep acid flowing.',
    'Gut hormones are the gut reading the meal\'s composition and pacing itself accordingly: protein and distension drive gastrin, fat and protein drive CCK (which also slows gastric emptying so the small intestine isn\'t overwhelmed), and carbohydrate and fat drive the incretins GIP and GLP-1 — the reason oral glucose triggers more insulin release than the same glucose given intravenously.',
    'Falling duodenal pH as acidic chyme empties in is what triggers secretin, which drives pancreatic bicarbonate secretion to neutralize it — a direct acid-base handoff from stomach to duodenum, and a small-scale preview of the same buffering logic used throughout acid-base physiology.',
    'Acid secretion is normally self-limiting: once gastric pH falls far enough, somatostatin brakes further gastrin release. A gastrinoma (Zollinger-Ellison syndrome) secretes autonomously and bypasses that brake entirely, which is also why chronic PPI therapy paradoxically raises gastrin — suppressing acid removes the very signal that would otherwise rein gastrin back in. Between meals, the migrating motor complex sweeps the fasting gut clear in interdigestive waves; eating interrupts it until the next fast begins.',
  ],
};
