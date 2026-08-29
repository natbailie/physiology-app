import { useEffect, useState } from 'react';
import { THEMES } from '@/home/moduleRegistry';
import { CLASS_IDS, FAMILY_SLUGS } from '@/medications/drugs';
import { routeIdFromHash } from './scenarioUrl';

/** `#theme/<id>` — one browse route per theme, generated so THEMES stays the single source
 * of truth. The prefix also keeps them distinct from module routes that share a name. */
export type ThemeRouteId = `theme/${(typeof THEMES)[number]['id']}`;

/** `#medications/<familyOrClassId>` — one route per drug family and per class in the formulary. */
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
  ...THEMES.map((theme) => `theme/${theme.id}` as ThemeRouteId),
];

function resolveHash(): RouteId {
  // A hash may carry a shared scenario (`#respiratory?s=...`); the route is only the part
  // before the query, so an unrecognised payload can never send a learner to the home page.
  const id = routeIdFromHash(window.location.hash);

  // `#medications/<familyOrClassId>` is a valid sub-route when the family or class exists.
  // Validated against the formulary so a stale or hand-edited link to a removed family or class
  // falls back to the hub rather than rendering a blank page.
  if (id.startsWith('medications/')) {
    const subId = id.slice('medications/'.length);
    return CLASS_IDS.has(subId) || FAMILY_SLUGS.has(subId) ? (id as RouteId) : 'medications';
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
