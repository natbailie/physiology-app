import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { DISCIPLINES, THEMES } from '@/home/moduleRegistry';
import { PAGES } from '@/pages';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';
import { MEDICATION_INVALID, resolveMedicationRoute } from '@/medications/drugs';
import { routeIdFromHash } from './scenarioUrl';

/** `#discipline/<id>` — one browse route per subject, generated so DISCIPLINES stays the
 * single source of truth. A discipline that names its own `href` (its only theme is already a
 * hub) gets no route: the tier would render a single tile, so nothing should link there. */
export type DisciplineRouteId = `discipline/${(typeof DISCIPLINES)[number]['id']}`;

/** `#theme/<id>` — one browse route per theme, generated so THEMES stays the single source
 * of truth. The prefix also keeps them distinct from module routes that share a name. */
export type ThemeRouteId = `theme/${(typeof THEMES)[number]['id']}`;

/** `#medications/<...>` — one route per family/class, plus the deeper Infection branches
 * (antimicrobial subfamily and, for antibiotics, mechanism-of-action tier). */
export type MedicationRouteId = `medications/${string}`;

export type RouteId =
  | 'home'
  | 'accessibility'
  | 'account'
  | 'privacy'
  | 'methodology'
  | 'review-h'
  | 'teacher'
  | 'pricing'
  | 'cardiorenal'
  | 'respiratory'
  | 'hpaAxis'
  | 'hptAxis'
  | 'gastrointestinal'
  | 'glucoseRegulation'
  | 'calciumHomeostasis'
  | 'membranePotentials'
  | 'metabolism'
  | 'toxicology'
  | 'anaesthesia'
  | 'cognitiveNeuroscience'
  | 'autonomicNervous'
  | 'renalTubular'
  | 'cardiacElectro'
  | 'respiratoryMechanics'
  | 'mechanicalVentilation'
  | 'respiratoryFailure'
  | 'hpgAxis'
  | 'ecgConduction'
  | 'coagulation'
  | 'erythropoiesis'
  | 'immuneResponse'
  | 'hypersensitivity'
  | 'muscleContraction'
  | 'electrolyteBalance'
  | 'capillaryExchange'
  | 'venousReturn'
  | 'shockStates'
  | 'fetalCirculation'
  | 'neuromuscularJunction'
  | 'cerebralPerfusion'
  | 'vision'
  | 'hearing'
  | 'vestibular'
  | 'somaticSensation'
  | 'motorControl'
  | 'liverPhysiology'
  | 'pregnancy'
  | 'anteriorPituitary'
  | 'adrenalCortex'
  | 'adrenalMedulla'
  | 'bloodGroups'
  | 'thermoregulation'
  | 'exercisePhysiology'
  | 'coronaryCirculation'
  | 'enzymeKinetics'
  | 'cellCycle'
  | 'digestionAbsorption'
  | 'inflammation'
  | 'micturition'
  | 'reference'
  | 'medications'
  | DisciplineRouteId
  | ThemeRouteId
  | MedicationRouteId;

/** Exported so `moduleRegistry.test.ts` can assert every available module has a route. */
export const VALID_ROUTES: RouteId[] = [
  'accessibility',
  'account',
  'privacy',
  'methodology',
  'review-h',
  'teacher',
  'pricing',
  'cardiorenal',
  'respiratory',
  'hpaAxis',
  'hptAxis',
  'gastrointestinal',
  'glucoseRegulation',
  'calciumHomeostasis',
  'membranePotentials',
  'metabolism',
  'toxicology',
  'anaesthesia',
  'cognitiveNeuroscience',
  'autonomicNervous',
  'renalTubular',
  'cardiacElectro',
  'respiratoryMechanics',
  'mechanicalVentilation',
  'respiratoryFailure',
  'hpgAxis',
  'ecgConduction',
  'coagulation',
  'erythropoiesis',
  'immuneResponse',
  'hypersensitivity',
  'muscleContraction',
  'electrolyteBalance',
  'capillaryExchange',
  'venousReturn',
  'shockStates',
  'fetalCirculation',
  'neuromuscularJunction',
  'cerebralPerfusion',
  'vision',
  'hearing',
  'vestibular',
  'somaticSensation',
  'motorControl',
  'liverPhysiology',
  'pregnancy',
  'anteriorPituitary',
  'adrenalCortex',
  'adrenalMedulla',
  'bloodGroups',
  'thermoregulation',
  'exercisePhysiology',
  'coronaryCirculation',
  'enzymeKinetics',
  'cellCycle',
  'digestionAbsorption',
  'inflammation',
  'micturition',
  'reference',
  'medications',
  ...DISCIPLINES.filter((discipline) => discipline.status === 'available' && !discipline.href).map(
    (discipline) => `discipline/${discipline.id}` as DisciplineRouteId,
  ),
  ...THEMES.map((theme) => `theme/${theme.id}` as ThemeRouteId),
];

function resolveHash(): RouteId {
  // A hash may carry a shared scenario (`#respiratory?s=...`); the route is only the part
  // before the query, so an unrecognised payload can never send a learner to the home page.
  const id = routeIdFromHash(window.location.hash);

  // `#medications/<...>` is a valid sub-route when the remaining path names a real family, class,
  // antimicrobial branch or (for antibiotics) mechanism-of-action group. Validated against the
  // formulary so a stale or hand-edited link to a removed entry falls back to the hub rather than
  // rendering a blank page.
  if (id.startsWith('medications/')) {
    const segments = id.slice('medications/'.length).split('/');
    return resolveMedicationRoute(segments) !== MEDICATION_INVALID
      ? (id as RouteId)
      : 'medications';
  }

  return VALID_ROUTES.includes(id as RouteId) ? (id as RouteId) : 'home';
}

/**
 * How long a navigation will wait for the next page's chunk before committing anyway.
 *
 * Almost every navigation in the app is warmed by `useLinkPrefetch` on hover or pointer-down, so
 * this budget is for the ones that are not: the back button, a typed URL, a keyboard activation
 * that skipped the pointer entirely. Waiting unboundedly would leave the OLD page on screen with
 * the new URL in the bar, which reads as a frozen app; the transition runs either way and the
 * worst case is the blank fallback fading in, which is what every navigation did before.
 */
const CHUNK_WAIT_MS = 250;

/** Minimal hash-based router: gives URL persistence and browser back/forward support
 * across the app's module pages with zero new dependencies. */
export function useHashRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() => resolveHash());

  useEffect(() => {
    const onChange = () => {
      const next = resolveHash();
      const commit = () => {
        // `flushSync`, because `startViewTransition` captures the page as it is when its callback
        // RETURNS. A batched update would land in a later frame, after the snapshot, and the
        // transition would cross-fade the old page into itself.
        flushSync(() => setRoute(next));
        // Inside the same callback, so the scroll reset is part of the change being captured
        // rather than a jump after it. There was no scroll reset at all before: crossing from a
        // module page to the home grid left the viewport wherever the module had been scrolled to,
        // which is most of why navigation read as broken.
        window.scrollTo({ top: 0, behavior: 'auto' });
      };

      // Progressive enhancement, and the reduced-motion guard has to be here rather than in CSS:
      // the blanket `@media (prefers-reduced-motion: reduce)` rule in `index.css` is written
      // against `*`, and the view-transition pseudo-elements are not elements.
      if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
        commit();
        return;
      }

      const ready = PAGES[next]?.preload() ?? Promise.resolve();
      void Promise.race([
        ready.catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, CHUNK_WAIT_MS)),
      ]).then(() => document.startViewTransition(commit));
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
