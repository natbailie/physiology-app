import { IONS } from './constants';

/**
 * Conductance-weighted membrane potential — a simplified Goldman-Hodgkin-Katz. Rather than
 * GHK's permeability-weighted log of concentration ratios, this takes the conductance-weighted
 * average of each ion's equilibrium potential: the equivalent-circuit ("chord conductance")
 * form of the same idea, which behaves identically for teaching purposes.
 *
 * The takeaway is the same either way: membrane potential sits nearest the equilibrium
 * potential of whichever ion the membrane is currently most permeable to. At rest that is K+
 * (hence Vm near E_K); at the peak of the spike it is Na+ (hence Vm swinging toward E_Na).
 *
 * Both arguments are TOTAL conductances for that ion, background leak included.
 */
export function weightedMembranePotential(gNaTotal: number, eNaMv: number, gKTotal: number, eKMv: number): number {
  const totalConductance = gNaTotal + gKTotal;
  if (totalConductance <= 0) return eKMv;
  return (gNaTotal * eNaMv + gKTotal * eKMv) / totalConductance;
}

/** The potential the cell settles at with all voltage-gated channels closed — set entirely by
 * the K-dominated background leak, which is why extracellular K+ is the strongest determinant
 * of resting Vm and why hyperkalemia depolarizes the cell. */
export function restingPotential(eKMv: number, eNaMv: number): number {
  return weightedMembranePotential(IONS.LEAK_NA_CONDUCTANCE, eNaMv, IONS.LEAK_K_CONDUCTANCE, eKMv);
}
