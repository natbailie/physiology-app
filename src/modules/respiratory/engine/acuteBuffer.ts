import { ACUTE_BUFFER, GAS_EXCHANGE } from './constants';
import { clamp } from '@/shared/lib/math';

/** Target fast, non-renal chemical buffering (-1..1) — intracellular/protein buffers
 * respond within minutes to a PaCO2 deviation, well before renal compensation engages. */
export function acuteBufferDriveTarget(currentPaCO2: number): number {
  return clamp((currentPaCO2 - GAS_EXCHANGE.BASELINE_PACO2_MMHG) / ACUTE_BUFFER.CO2_RANGE_MMHG, -1, 1);
}
