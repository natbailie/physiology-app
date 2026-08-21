import { useEffect, useState } from 'react';

export type RouteId =
  | 'home'
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
  | 'muscleContraction'
  | 'electrolyteBalance'
  | 'capillaryExchange'
  | 'venousReturn'
  | 'shockStates'
  | 'fetalCirculation'
  | 'neuromuscularJunction'
  | 'reference';

const VALID_ROUTES: RouteId[] = [
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
  'muscleContraction',
  'electrolyteBalance',
  'capillaryExchange',
  'venousReturn',
  'shockStates',
  'fetalCirculation',
  'neuromuscularJunction',
  'reference',
];

function resolveHash(): RouteId {
  const id = window.location.hash.replace('#', '');
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
