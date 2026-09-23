import { useEffect } from 'react';
import { PAGES } from '@/pages';
import { routeIdFromHash } from './scenarioUrl';
import type { RouteId } from './useHashRoute';

/**
 * Fetches a page's chunk the moment a learner shows interest in the link, rather than when they
 * commit to it.
 *
 * Every page but the home grid is a separate chunk, and the Suspense fallback that covers the wait
 * is deliberately invisible — so clicking a module used to show an empty screen for as long as the
 * network took. Warming on hover, focus or pointer-down buys the whole of that: a pointer reaches
 * a tile some hundreds of milliseconds before it presses, and pointer-down precedes the click that
 * changes the hash.
 *
 * One delegated listener rather than handlers on each card. Every navigation in this app is a plain
 * `<a href="#...">` — the module cards, the theme and subject grids, the breadcrumbs, the four-tier
 * medications tree, the "show me" links inside the explainers — and a prop threaded through each of
 * those is a prop the next one will forget. `pointerover` rather than `pointerenter` because only
 * the former bubbles to the document.
 */
export function useLinkPrefetch(): void {
  useEffect(() => {
    const warm = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      const href = anchor?.getAttribute('href');
      if (!href || href === '#') return;
      // An id with no entry is a browse page, an unknown route, or one of the eager four; the
      // optional call is the whole of the handling those need.
      void PAGES[routeIdFromHash(href) as RouteId]?.preload().catch(() => undefined);
    };
    // Passive: none of these ever calls `preventDefault`, and saying so keeps them off the
    // critical path of a scroll that starts on a card.
    const options = { passive: true } as const;
    document.addEventListener('pointerover', warm, options);
    document.addEventListener('pointerdown', warm, options);
    document.addEventListener('focusin', warm, options);
    return () => {
      document.removeEventListener('pointerover', warm);
      document.removeEventListener('pointerdown', warm);
      document.removeEventListener('focusin', warm);
    };
  }, []);
}
