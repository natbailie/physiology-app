import { useEffect, useRef } from 'react';
import { DISCIPLINES, MODULES, THEMES } from '@/home/moduleRegistry';
import { LEGAL_DOCS, isLegalDocId } from '@/shared/legal';
import type { RouteId } from './useHashRoute';

const SITE = 'Physiology Lab';

const UTILITY_TITLES: Partial<Record<string, string>> = {
  home: 'Home',
  account: 'Your account',
  pricing: 'Pricing',
  methodology: 'How the physiology is checked',
  'review-h': 'Accessibility review',
  teacher: 'Your classes',
  reviews: 'Reviews',
  reference: 'Formula reference',
  medications: 'Medications',
};

/** The document title for a route: "<Page> — Physiology Lab". WCAG 2.4.2. */
export function routeTitle(route: RouteId): string {
  let page: string | undefined = UTILITY_TITLES[route];
  if (!page && isLegalDocId(route)) page = LEGAL_DOCS[route].title;
  if (!page && route.startsWith('theme/')) page = THEMES.find((t) => `theme/${t.id}` === route)?.name;
  if (!page && route.startsWith('discipline/')) page = DISCIPLINES.find((d) => `discipline/${d.id}` === route)?.name;
  if (!page && route.startsWith('medications/')) page = 'Medications';
  if (!page) page = MODULES.find((m) => m.id === route)?.name;
  return page && route !== 'home' ? `${page} — ${SITE}` : SITE;
}

/**
 * Title and focus on every navigation.
 *
 * Without this every route was titled "Physiology Lab", and focus stayed on the link that was
 * pressed — which the new page had just unmounted, so it fell to <body> and a screen-reader user
 * heard nothing at all about where they had arrived (2.4.2, 2.4.3). Focus goes to `#main`, the
 * skip-link target, which already carries tabindex=-1. Not on first load: that would steal the
 * browser's own starting point.
 */
export function useRouteFocus(route: RouteId) {
  const first = useRef(true);
  useEffect(() => {
    document.title = routeTitle(route);
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [route]);
}
