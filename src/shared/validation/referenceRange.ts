/**
 * Where an asserted physiological range actually came from.
 *
 * The point of this type is to make unsourced numbers VISIBLE rather than to pretend they are
 * sourced. Most baseline bands in this repo were calibrated against remembered textbook values and
 * then written into a test as a bare literal; that is not nothing, but it is not something a
 * reviewer can check. Recording the difference honestly is worth more than a uniform-looking
 * citation list that would not survive being audited.
 */
export type Provenance =
  /** Corroborated by a committed reference trace from an independently validated engine. */
  | { kind: 'oracle'; trace: string; observed: number; note: string }
  /** A citation someone can look up: a named source, a guideline with its version, or a DOI. */
  | { kind: 'literature'; citation: string; note?: string }
  /**
   * Inherited from the original calibration with no external check yet. `needs` says what would
   * settle it, so this is a work item rather than a shrug.
   */
  | { kind: 'unsourced'; needs: string };

export interface ReferenceRange {
  low: number;
  high: number;
  unit: string;
  provenance: Provenance;
}

export type ReferenceRanges = Record<string, ReferenceRange>;

/** How much of a module's asserted physiology is backed by something external. */
export function provenanceCoverage(ranges: ReferenceRanges) {
  const entries = Object.values(ranges);
  const corroborated = entries.filter((r) => r.provenance.kind !== 'unsourced');
  return {
    total: entries.length,
    corroborated: corroborated.length,
    unsourced: entries.length - corroborated.length,
  };
}
