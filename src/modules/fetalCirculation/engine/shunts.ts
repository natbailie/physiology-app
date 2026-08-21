import { ATRIA, CLASSIFICATION, DUCTUS, PULMONARY, SATURATION, SYSTEMIC } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { CirculationPhase } from './types';

/**
 * Pulmonary vascular resistance the lungs are heading toward.
 *
 * Two separate things bring it down and BOTH are required. Mechanical aeration opens the
 * vessels the fluid was compressing; oxygen relaxes the hypoxic vasoconstriction. A lung that
 * is inflated but hypoxic stays constricted, which is exactly the trap in persistent pulmonary
 * hypertension — and why the treatment is oxygen and pulmonary vasodilators rather than
 * more pressure.
 */
export function oxygenationDrive(lungInflation: number, inspiredOxygen: number): number {
  // What matters is the oxygenation actually ACHIEVED, which needs an aerated lung first. A
  // fluid-filled lung on 100% oxygen achieves nothing; an aerated lung on air achieves most of
  // the effect, which is how an unassisted newborn transitions.
  const fromAir = scaleClamped(
    inspiredOxygen,
    0.15,
    PULMONARY.OXYGEN_FULL_EFFECT_FIO2,
    PULMONARY.OXYGEN_ROOM_AIR_EFFECT,
    1,
  );
  return clamp(lungInflation, 0, 1) * clamp(fromAir, 0, 1);
}

export function pulmonaryResistanceTarget(
  lungInflation: number,
  inspiredOxygen: number,
  vasoreactivity: number,
): number {
  const oxygenEffect = oxygenationDrive(lungInflation, inspiredOxygen);
  const relaxation =
    (PULMONARY.INFLATION_SHARE * clamp(lungInflation, 0, 1) + PULMONARY.OXYGEN_SHARE * oxygenEffect) *
    clamp(vasoreactivity, 0, 2);

  return PULMONARY.FETAL_PVR - (PULMONARY.FETAL_PVR - PULMONARY.MATURE_PVR) * clamp(relaxation, 0, 1);
}

/** Systemic resistance, including the placenta while it is still attached. Clamping the cord
 * removes a large low-resistance bed, so systemic resistance rises the moment it is cut. */
export function systemicResistance(placentalCirculation: number, systemicToneScale: number): number {
  const placentalConductance = SYSTEMIC.PLACENTAL_CONDUCTANCE_SHARE * clamp(placentalCirculation, 0, 1);
  return SYSTEMIC.BASE_SVR * clamp(systemicToneScale, 0.2, 2.5) * (1 - placentalConductance);
}

/** Where the ductus arteriosus is heading: oxygen constricts it, prostaglandin holds it open.
 * In utero the placenta supplies the prostaglandin, which is why the duct is patent before
 * birth and why a synthetic infusion can keep it that way in a duct-dependent lesion. */
export function ductalPatencyTarget(postDuctalSaturation: number, prostaglandinLevel: number): number {
  const oxygenClosure = scaleClamped(
    postDuctalSaturation,
    DUCTUS.OXYGEN_CONSTRICTION_SAT_LOW,
    DUCTUS.OXYGEN_CONSTRICTION_SAT_HIGH,
    0,
    1,
  );
  const prostaglandinHold = clamp(prostaglandinLevel / DUCTUS.PROSTAGLANDIN_HOLD, 0, 1);
  return clamp(1 - oxygenClosure * (1 - prostaglandinHold), 0, 1);
}

/**
 * How right ventricular output divides between the lungs and the duct, by conductance.
 *
 * In the fetus pulmonary resistance is far higher than the duct plus the systemic bed, so most
 * right ventricular output takes the short cut across the duct and into the descending aorta —
 * bypassing lungs that are doing nothing. After transition the ratio inverts.
 */
export function pulmonaryFlowFraction(pvr: number, ductalPatency: number, svr: number): number {
  const pulmonaryConductance = 1 / Math.max(pvr, 0.05);
  const ductalConductance = clamp(ductalPatency, 0, 1) / (DUCTUS.PATENT_RESISTANCE + Math.max(svr, 0.05));
  const total = pulmonaryConductance + ductalConductance;
  return total <= 0 ? 1 : pulmonaryConductance / total;
}

/** Atrial pressures. Right is held up by placental return through the ductus venosus; left
 * rises only once the lungs are actually carrying blood back to it. */
export function atrialPressures(
  placentalCirculation: number,
  ductusVenosusPatency: number,
  pulmonaryFlowFraction: number,
): { right: number; left: number } {
  const placentalReturn = clamp(placentalCirculation, 0, 1) * clamp(ductusVenosusPatency, 0, 1);
  return {
    right: ATRIA.BASE_RA_MMHG + (ATRIA.FETAL_RA_MMHG - ATRIA.BASE_RA_MMHG) * placentalReturn,
    left: ATRIA.FETAL_LA_MMHG + (ATRIA.MATURE_LA_MMHG - ATRIA.FETAL_LA_MMHG) * clamp(pulmonaryFlowFraction, 0, 1),
  };
}

/** Saturation of blood leaving whichever organ is doing the oxygenating. Before birth that is
 * the placenta, and even its best blood is only about 80% saturated. */
/** Saturation of the systemic venous blood the shunts carry. Higher before birth, because the
 * placenta returns oxygenated blood into the inferior vena cava. */
export function shuntedVenousSaturation(placentalCirculation: number): number {
  return (
    SATURATION.SYSTEMIC_VENOUS +
    (SATURATION.UMBILICAL_VEIN - SATURATION.SYSTEMIC_VENOUS) *
      SATURATION.PLACENTAL_VENOUS_LIFT *
      clamp(placentalCirculation, 0, 1)
  );
}

export function oxygenatedSourceSaturation(
  placentalCirculation: number,
  lungInflation: number,
  inspiredOxygen: number,
): number {
  const placental = SATURATION.UMBILICAL_VEIN * clamp(placentalCirculation, 0, 1);
  const alveolar =
    (SATURATION.ATELECTATIC +
      (SATURATION.ALVEOLAR_ROOM_AIR - SATURATION.ATELECTATIC) * clamp(lungInflation, 0, 1)) *
    scaleClamped(inspiredOxygen, 0.18, 0.3, 0.94, 1.02);
  const lung = clamp(alveolar, SATURATION.ATELECTATIC, 100) * clamp(lungInflation, 0, 1);
  return Math.max(placental, lung, SATURATION.ATELECTATIC);
}

export function classifyPhase(
  pvr: number,
  ductalShuntFraction: number,
  placentalCirculation: number,
  saturationGap: number,
): CirculationPhase {
  if (placentalCirculation > 0.5) return 'fetal';
  if (pvr > CLASSIFICATION.TRANSITIONED_PVR && saturationGap > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT) {
    return 'persistent fetal circulation';
  }
  if (ductalShuntFraction < -CLASSIFICATION.SIGNIFICANT_SHUNT) return 'left-to-right shunt';
  if (pvr > CLASSIFICATION.TRANSITIONED_PVR) return 'transitional';
  return 'neonatal';
}

export function shuntSummary(ductalShuntFraction: number, atrialShuntFraction: number, gap: number): string {
  const ductal =
    ductalShuntFraction > CLASSIFICATION.SIGNIFICANT_SHUNT
      ? 'duct shunting right-to-left'
      : ductalShuntFraction < -CLASSIFICATION.SIGNIFICANT_SHUNT
        ? 'duct shunting left-to-right'
        : 'no significant ductal shunt';

  const atrial = atrialShuntFraction > 0.05 ? 'foramen open right-to-left' : 'foramen functionally closed';
  const cyanosis = gap > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT ? 'differential cyanosis' : 'saturations uniform';

  return `${ductal}, ${atrial}, ${cyanosis}`;
}
