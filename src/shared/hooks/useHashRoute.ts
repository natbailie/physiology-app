import { useEffect, useState } from 'react';
import { DISCIPLINES, THEMES } from '@/home/moduleRegistry';
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
  | 'account'
  | 'privacy'
  | 'pricing'
  | 'cardiorenal'
  | 'respiratory'
  | 'hpaAxis'
  | 'hptAxis'
  | 'gastrointestinal'
  | 'glucoseRegulation'
  | 'calciumHomeostasis'
  | 'membranePotentials'
  | 'autonomicNervous'
  | 'renalTubular'
  | 'cardiacElectro'
  | 'respiratoryMechanics'
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
  'account',
  'privacy',
  'pricing',
  'cardiorenal',
  'respiratory',
  'hpaAxis',
  'hptAxis',
  'gastrointestinal',
  'glucoseRegulation',
  'calciumHomeostasis',
  'membranePotentials',
  'autonomicNervous',
  'renalTubular',
  'cardiacElectro',
  'respiratoryMechanics',
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

/** Minimal hash-based router: gives URL persistence and browser back/forward support
 * across the app's module pages with zero new dependencies. */
export function useHashRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() => resolveHash());

  useEffect(() => {
    const onChange = () => setRoute(resolveHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
