/** Raw SVG path strings reused across module diagrams, kept separate from any one component's animation/behavior. */
export const KIDNEY_PATH =
  'M-8,-32 C10,-36 24,-22 22,-4 C21,6 10,4 6,13 C2,21 10,26 18,24 C26,34 14,44 -2,42 C-20,39 -26,18 -22,-2 C-19,-20 -18,-28 -8,-32 Z';

/** Small rounded blob representing the hypothalamus, sized to sit above PITUITARY_PATH. */
export const HYPOTHALAMUS_PATH =
  'M-14,-6 C-14,-16 -2,-20 8,-14 C18,-8 16,4 6,10 C-4,16 -16,10 -16,-2 C-16,-4 -15,-5 -14,-6 Z';

/** Small teardrop gland representing the (anterior) pituitary, hanging below the hypothalamus. */
export const PITUITARY_PATH = 'M-8,-10 C-8,-16 -2,-18 4,-14 C10,-10 10,-2 4,4 C0,8 -6,8 -8,2 C-10,-3 -9,-7 -8,-10 Z';

/** J-shaped sac representing the stomach — fundus/body at the top, antrum narrowing toward
 * the pylorus at bottom-right. */
export const STOMACH_PATH =
  'M-30,-40 C-10,-46 20,-40 28,-18 C34,-2 30,14 14,26 C-2,38 -22,34 -30,18 C-38,2 -40,-20 -30,-40 Z';

/** A loosely coiled ribbon representing a run of small intestine (duodenum onward) —
 * stylized, not anatomically literal, matching the rest of the app's hand-drawn organs. */
export const SMALL_INTESTINE_PATH =
  'M-40,-10 C-30,-24 -10,-24 0,-10 C10,4 30,4 40,-10 C46,-2 46,10 38,16 C26,24 14,10 0,16 C-14,22 -26,8 -38,16 C-46,10 -46,-2 -40,-10 Z';

/** Elongated leaf shape representing the pancreas, tucked behind/below the stomach. */
export const PANCREAS_PATH = 'M-32,-6 C-30,-14 -18,-16 -6,-14 C10,-12 26,-8 34,0 C30,8 14,10 -2,8 C-16,6 -28,4 -32,-6 Z';

/** Broad wedge representing the liver — larger right lobe tapering to a left lobe. */
export const LIVER_PATH = 'M-38,-16 C-16,-26 20,-26 38,-14 C42,4 30,22 6,26 C-14,29 -34,20 -40,2 C-41,-5 -40,-12 -38,-16 Z';
