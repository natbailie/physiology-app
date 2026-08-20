/** Henderson-Hasselbalch: pH = 6.1 + log10(HCO3- / (0.03 * PaCO2)). */
export function pH(plasmaHCO3: number, currentPaCO2: number): number {
  return 6.1 + Math.log10(plasmaHCO3 / (0.03 * currentPaCO2));
}
