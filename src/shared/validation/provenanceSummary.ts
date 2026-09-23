import type { ReferenceRanges } from './referenceRange';

/**
 * How a module's physiology is anchored, said in a sentence a learner or a reviewer can read.
 *
 * This exists because the honest answer is a selling point rather than a liability. Every
 * competitor asserts accuracy; none of them say which of their numbers are checkable and which
 * are not. `references.ts` has recorded the difference per band since the verification harness
 * was generalised — this turns that record into something the app actually shows.
 *
 * The tiers are ordered by how hard the evidence is to fake, matching the ordering in `CLAUDE.md`.
 * A module's tier is the STRONGEST evidence any of its bands carries, and the sentence says what
 * is NOT covered as plainly as what is: a module whose dynamic response has never been checked
 * against anything external must not read as though it has.
 */

export type ProvenanceTier = 'oracle' | 'literature' | 'unsourced';

export interface ProvenanceSummary {
  /** Strongest evidence any band in this module carries. */
  tier: ProvenanceTier;
  total: number;
  oracle: number;
  literature: number;
  unsourced: number;
  /** Corroborated as a whole percentage, for the ratchet and the methodology table. */
  percent: number;
  /** One sentence, for the module footnote. */
  sentence: string;
}

const TIER_ORDER: Record<ProvenanceTier, number> = { unsourced: 0, literature: 1, oracle: 2 };

export function summarise(ranges: ReferenceRanges): ProvenanceSummary {
  const entries = Object.values(ranges);
  const counts = { oracle: 0, literature: 0, unsourced: 0 };
  let tier: ProvenanceTier = 'unsourced';

  for (const range of entries) {
    const kind = range.provenance.kind;
    counts[kind] += 1;
    if (TIER_ORDER[kind] > TIER_ORDER[tier]) tier = kind;
  }

  const total = entries.length;
  const corroborated = counts.oracle + counts.literature;
  const percent = total === 0 ? 0 : Math.round((corroborated / total) * 100);

  return { tier, total, ...counts, percent, sentence: sentenceFor(tier, total, counts) };
}

/**
 * The wording is deliberately load-bearing.
 *
 * "Corroborated against the Pulse Physiology Engine" is a claim about a specific, checkable
 * artefact — a committed trace from an independently validated model. "Anchored to published
 * reference intervals" is a weaker claim and says so. Neither is allowed to imply the other, and
 * the unsourced tail is always named, because a reviewer who finds an unstated gap stops trusting
 * the stated ones too.
 */
function sentenceFor(
  tier: ProvenanceTier,
  total: number,
  counts: { oracle: number; literature: number; unsourced: number },
): string {
  // "1 of 6 quantities IS an index": the noun agrees with the set it is drawn from, the verb with
  // how many of them there are. Agreeing both with the count reads as a typo in the footnote.
  const noun = total === 1 ? 'quantity' : 'quantities';
  const verb = counts.unsourced === 1 ? 'is' : 'are';
  const gap =
    counts.unsourced === 0
      ? ''
      : ` ${counts.unsourced} of ${total} ${noun} ${verb} an index with no published interval to check against, and each records what would settle it.`;

  if (tier === 'oracle') {
    return (
      `Baseline anchored to published reference intervals, and ${counts.oracle} of ${total} ` +
      `quantities corroborated against a committed trace from the Pulse Physiology Engine — an ` +
      `independently built and separately validated model of the same physiology.${gap}`
    );
  }

  if (tier === 'literature') {
    return (
      `Baseline anchored to published reference intervals, and the build fails if it drifts ` +
      `outside them. The dynamic response has not been checked against an independent engine.${gap}`
    );
  }

  return (
    `This module's quantities are indices rather than measured units, so no published reference ` +
    `interval applies yet. Each records what would settle it.`
  );
}

/** Short badge text for a catalogue tile or a table cell. */
export function tierLabel(tier: ProvenanceTier): string {
  if (tier === 'oracle') return 'Engine-corroborated';
  if (tier === 'literature') return 'Literature-anchored';
  return 'Indices only';
}
