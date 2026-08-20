import { CARDIAC, PLOT } from './constants';
import { cardiacOutput } from './cardiacFunctionCurve';
import { venousReturn } from './venousReturnCurve';
import type { LimitingFactor } from './types';

/**
 * Where the two curves cross.
 *
 * The system has exactly one steady state: the right atrial pressure at which the heart pumps
 * out precisely what the circulation delivers. Both curves are functions of that same pressure,
 * and it is the only variable they share — which is why plotting them together, rather than
 * separately, is what makes the relationship visible.
 *
 * The engine does not USE this value to advance the simulation; right atrial pressure gets there
 * on its own by mass balance. It is computed here so the crossing can be marked on the plot and
 * so the readouts can say where the system is heading.
 */
export function findOperatingPoint(
  meanSystemicFillingPressureMmHg: number,
  resistance: number,
  intrathoracicPressureMmHg: number,
  plateau: number,
): { pra: number; flow: number } {
  // Venous return falls with right atrial pressure and cardiac output rises with it, so their
  // difference is monotonic and a bisection always converges.
  const difference = (pra: number) =>
    venousReturn(pra, meanSystemicFillingPressureMmHg, resistance) - cardiacOutput(pra, intrathoracicPressureMmHg, plateau);

  let low = PLOT.PRA_MIN;
  let high = PLOT.PRA_MAX;
  if (difference(low) <= 0) return { pra: low, flow: cardiacOutput(low, intrathoracicPressureMmHg, plateau) };
  if (difference(high) >= 0) return { pra: high, flow: cardiacOutput(high, intrathoracicPressureMmHg, plateau) };

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (difference(mid) > 0) low = mid;
    else high = mid;
  }
  const pra = (low + high) / 2;
  return { pra, flow: cardiacOutput(pra, intrathoracicPressureMmHg, plateau) };
}

/**
 * What is actually limiting flow at the operating point.
 *
 * On the steep part of the cardiac function curve, the heart will pump whatever arrives, so
 * output is set by venous return — preload-limited, which is where a normal circulation sits.
 * On the flat part, more filling achieves nothing and the heart itself is the constraint.
 * And with a high systemic vascular resistance, the ceiling has been lowered by afterload rather
 * than by the myocardium.
 */
export function limitingFactor(
  operatingPra: number,
  intrathoracicPressureMmHg: number,
  plateau: number,
  systemicVascularResistance: number,
): LimitingFactor {
  const flow = cardiacOutput(operatingPra, intrathoracicPressureMmHg, plateau);
  const fractionOfPlateau = flow / Math.max(plateau, 0.01);

  if (fractionOfPlateau < CARDIAC.PUMP_LIMITED_PLATEAU_FRACTION) return 'preload';
  // Near the ceiling: either the myocardium is the limit, or the ceiling itself has been pulled
  // down by the pressure the heart is ejecting against.
  return systemicVascularResistance >= CARDIAC.AFTERLOAD_LIMITED_SVR ? 'afterload' : 'pump';
}
