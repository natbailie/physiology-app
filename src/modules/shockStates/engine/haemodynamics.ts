import { BAROREFLEX, CIRCULATION, HEART, PULMONARY } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Mean systemic filling pressure, mmHg — the pressure the vessels would settle at with the heart
 * stopped. Only STRESSED volume contributes; the rest merely fills the vessels.
 *
 * The unstressed compartment is a CAPACITY that recoils as blood is lost, not a fixed share of
 * whatever is left. That distinction is the whole dose-response of haemorrhage: baseline stressed
 * volume is only about 700 mL of a 5 L circulation, so once more than that has been bled the
 * filling pressure is held up by venoconstriction alone, and it falls away steeply rather than in
 * proportion. See `CIRCULATION.UNSTRESSED_RECOIL_EXPONENT`.
 */
export function meanSystemicFillingPressure(bloodVolumeMl: number, sympatheticDrive = 0): number {
  const remaining = clamp(bloodVolumeMl / CIRCULATION.BASELINE_BLOOD_VOLUME_ML, 0, 2);
  const unstressedCapacity =
    CIRCULATION.BASELINE_BLOOD_VOLUME_ML *
    CIRCULATION.UNSTRESSED_FRACTION *
    Math.pow(remaining, CIRCULATION.UNSTRESSED_RECOIL_EXPONENT);
  const stressed = Math.max(0, bloodVolumeMl - unstressedCapacity);
  const venoconstriction = 1 + BAROREFLEX.VENOCONSTRICTION_GAIN * clamp(sympatheticDrive, 0, 1);
  return (stressed / CIRCULATION.TOTAL_COMPLIANCE_ML_PER_MMHG) * venoconstriction;
}

/** Flow the circulation delivers back to the heart, L/min. Driven by the difference between
 * the filling pressure upstream and the atrial pressure downstream. */
export function venousReturn(pmsf: number, measuredCvp: number, svr: number): number {
  // Blood returning to the chest works against the MEASURED pressure, not the transmural one:
  // fluid in the pericardium opposes filling just as surely as a full ventricle does. This is
  // why tamponade reduces venous return at all.
  const resistance = CIRCULATION.BASELINE_RVR * (0.35 + 0.65 * clamp(svr, 0.1, 3));
  return Math.max(0, (pmsf - measuredCvp) / resistance);
}

/**
 * Cardiac output from the Frank-Starling relationship, L/min.
 *
 * The pressure that matters is TRANSMURAL — inside minus outside. A heart squeezed by fluid in
 * the pericardium is not filled by a high measured venous pressure, which is why tamponade
 * presents with a high CVP and a small, under-filled ventricle at the same time.
 */
export function cardiacOutputFromFilling(transmuralRap: number, contractility: number): number {
  const filling = Math.max(0, transmuralRap);
  const plateau = HEART.PLATEAU_L_PER_MIN * clamp(contractility, 0, 2.5);
  return plateau * (filling / (filling + HEART.STARLING_HALF_SATURATION_MMHG));
}

/**
 * How much of the right heart's output actually crosses the lungs to reach the left, L/min.
 *
 * A large embolus raises pulmonary vascular resistance, and the left ventricle can only eject
 * what reaches it. This is why massive PE produces a HIGH central venous pressure alongside a
 * LOW wedge pressure — the obstruction sits between the two measurements.
 */
export function transpulmonaryFlow(rightOutput: number, pulmonaryVascularResistance: number): number {
  const excess = Math.max(0, pulmonaryVascularResistance - 1);
  return rightOutput / (1 + PULMONARY.TRANSIT_PENALTY * excess);
}

/**
 * Pulmonary capillary wedge pressure, mmHg — a surrogate for left ventricular filling pressure.
 *
 * It rises when the left ventricle cannot clear what arrives (poor contractility, so blood
 * dams back into the lungs) and falls when little arrives in the first place (embolus,
 * hypovolaemia). Those two directions are exactly what separate cardiogenic from obstructive
 * and hypovolaemic shock at the bedside.
 */
export function wedgePressure(
  leftInflowLPerMin: number,
  contractility: number,
  pmsf: number = HEART.BASELINE_PMSF_MMHG,
  transitFraction: number = 1,
): number {
  const flowRatio = leftInflowLPerMin / CIRCULATION.BASELINE_CARDIAC_OUTPUT;
  // Two independent contributions, and separating them is the whole diagnostic value of this
  // number. How much blood ARRIVES sets the first; how badly the ventricle clears it sets the
  // second. An embolus cuts the first and leaves the second alone, so the wedge falls. A failing
  // ventricle raises the second, so the wedge climbs even as flow drops.
  const arriving = HEART.BASELINE_WEDGE_MMHG * flowRatio;
  const damming = HEART.CARDIOGENIC_WEDGE_GAIN * Math.max(0, 1 / clamp(contractility, 0.12, 2.5) - 1);
  // Extra circulating volume raises left-sided filling too — but only in so far as it can
  // actually reach the left heart, which is why fluid loads the wedge in cardiogenic shock and
  // does almost nothing to it behind an embolus.
  const volumeLoad =
    HEART.LEFT_PRELOAD_GAIN * Math.max(0, pmsf - HEART.BASELINE_PMSF_MMHG) * clamp(transitFraction, 0, 1);
  return clamp(arriving + damming + volumeLoad, 1, 45);
}

/** Mean arterial pressure, mmHg. Pressure is the PRODUCT of flow and resistance, which is why
 * a normal blood pressure never rules out shock — a rising resistance can hold it up while
 * flow collapses underneath. */
export function meanArterialPressure(cardiacOutput: number, effectiveSvr: number): number {
  return (
    CIRCULATION.BASELINE_MAP_MMHG *
    (cardiacOutput / CIRCULATION.BASELINE_CARDIAC_OUTPUT) *
    clamp(effectiveSvr, 0.1, 3)
  );
}

export function heartRate(sympatheticDrive: number): number {
  return HEART.BASELINE_RATE_BPM + (HEART.MAX_RATE_BPM - HEART.BASELINE_RATE_BPM) * clamp(sympatheticDrive, 0, 1);
}

/** Resistance the right heart actually works against, once pulmonary congestion from a failing
 * left ventricle is added to whatever intrinsic resistance is present. */
export function effectivePulmonaryResistance(baseResistance: number, wedgePressureMmHg: number): number {
  const congestion = Math.max(0, wedgePressureMmHg - HEART.BASELINE_WEDGE_MMHG) / 10;
  return baseResistance * (1 + PULMONARY.CONGESTION_GAIN * congestion);
}
