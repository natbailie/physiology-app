import { TGF } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target afferent arteriolar tone from tubuloglomerular feedback (0..1). The macula densa
 * sits where the thick ascending limb passes its own glomerulus and senses NaCl delivery
 * there. High delivery signals that the nephron is filtering faster than it can reabsorb, so
 * the afferent arteriole constricts and GFR falls — a per-nephron autoregulatory brake.
 *
 * Loop diuretics blunt this signal in a counterintuitive way: by blocking NKCC2 in the macula
 * densa cells themselves, they prevent the sensing of the very NaCl load they create.
 */
export function afferentToneTarget(distalNaClDelivery: number, maculaDensaFeedbackStrength: number, loopDiureticDose: number): number {
  const sensingCapacity = clamp(1 - loopDiureticDose / 100, 0, 1);
  const excessDelivery = Math.max(0, distalNaClDelivery - TGF.SETPOINT_DELIVERY);
  return clamp((excessDelivery / TGF.SENSITIVITY) * clamp(maculaDensaFeedbackStrength, 0, 1.5) * sensingCapacity, 0, 1);
}

/** GFR after the tubuloglomerular brake is applied. */
export function gfrAfterTGF(gfrMLPerMin: number, afferentTone: number): number {
  return gfrMLPerMin * (1 - afferentTone * TGF.MAX_GFR_REDUCTION);
}
