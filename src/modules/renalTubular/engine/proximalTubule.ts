import { TUBULE } from './constants';
import type { NephronSegment } from './types';

/**
 * Proximal convoluted tubule: reabsorbs about two-thirds of the filtered volume
 * ISO-OSMOTICALLY — solute and water leave together, so a large fraction of the filtrate
 * disappears while the osmolality of what remains barely changes. This is bulk reclamation,
 * not concentration; no urine concentrating work happens here at all.
 */
export function proximalTubule(): NephronSegment {
  return {
    label: 'Proximal tubule',
    osmolality: TUBULE.FILTRATE_OSMOLALITY,
    flowFraction: 1 - TUBULE.PROXIMAL_REABSORPTION_FRACTION,
  };
}
