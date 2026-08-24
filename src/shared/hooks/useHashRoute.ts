import { useEffect, useState } from 'react';
import { routeIdFromHash } from './scenarioUrl';

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
  | 'reference';

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
  'reference',
];

function resolveHash(): RouteId {
  // A hash may carry a shared scenario (`#respiratory?s=...`); the route is only the part
  // before the query, so an unrecognised payload can never send a learner to the home page.
  const id = routeIdFromHash(window.location.hash);
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
