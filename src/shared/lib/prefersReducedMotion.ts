/**
 * Whether the learner has asked their OS to reduce motion.
 *
 * Two callers with two different needs, and one implementation because they must agree. The engine
 * loop reads it to decide whether a module opens playing (`useEngineLoop`), and the router reads it
 * to decide whether to run a view transition at all.
 *
 * The router's read cannot be replaced by the global `@media (prefers-reduced-motion: reduce)` rule
 * in `index.css`: that rule matches `*`, and the view-transition pseudo-elements live in their own
 * tree rather than in the document, so no selector written against elements can reach them.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
