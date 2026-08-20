import { FIBRINOLYSIS } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target plasmin activity, 0..1.
 *
 * tPA released from endothelium converts plasminogen to plasmin, which digests fibrin. This
 * runs alongside clotting from the very beginning rather than waiting for it to finish — the
 * clot is continuously remodelled, and its final size is the balance between the two.
 */
export function plasminTarget(fibrin: number, fibrinolyticActivity: number): number {
  // Plasminogen is recruited onto the fibrin surface, so lysis scales with how much fibrin
  // there is to digest — the system only dissolves what it has actually built.
  return clamp(fibrin * (fibrinolyticActivity / 100) * FIBRINOLYSIS.PLASMIN_GAIN, 0, 1);
}

/**
 * Target D-dimer, 0..1 — a fragment released only when plasmin digests CROSS-LINKED fibrin.
 *
 * That specificity is what makes it useful: a raised D-dimer means a clot has both formed and
 * begun breaking down somewhere. In DIC, where clotting and lysis are simultaneously
 * rampant, it goes through the roof — which distinguishes DIC from the other causes of a
 * prolonged PT and APTT, such as liver disease, where it does not.
 */
export function dDimerTarget(plasmin: number, fibrin: number, fibrinolyticActivity: number): number {
  // Local contribution: lysis of the clot at the test injury itself.
  const local = plasmin * (0.35 + fibrin) * FIBRINOLYSIS.D_DIMER_GAIN * FIBRINOLYSIS.LOCAL_WEIGHT;

  // Systemic contribution: in DIC the fibrin being digested is not at this injury at all — it
  // is the widespread microvascular thrombosis happening throughout the circulation. Modelling
  // only the local clot would leave DIC with a LOW D-dimer, the exact opposite of reality, and
  // would lose the one value that separates it from liver disease on an otherwise similar panel.
  const systemicLysis = Math.max(0, fibrinolyticActivity / 100 - 1);
  const systemic = systemicLysis * FIBRINOLYSIS.SYSTEMIC_GAIN;

  return clamp(local + systemic, 0, 1);
}
