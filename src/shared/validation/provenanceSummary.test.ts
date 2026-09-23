import { describe, expect, it } from 'vitest';
import type { ReferenceRanges } from './referenceRange';
import { summarise, tierLabel } from './provenanceSummary';

const band = (provenance: ReferenceRanges[string]['provenance']): ReferenceRanges[string] => ({
  low: 1,
  high: 2,
  unit: 'mmHg',
  provenance,
});

const LITERATURE = band({ kind: 'literature', citation: 'A published interval.' });
const ORACLE = band({ kind: 'oracle', trace: 't', observed: 1.5, note: 'n' });
const UNSOURCED = band({ kind: 'unsourced', needs: 'x'.repeat(50) });

describe('a module states its strongest evidence, and its gaps', () => {
  it('reports the strongest tier any band reaches, not the commonest', () => {
    const summary = summarise({ a: LITERATURE, b: LITERATURE, c: ORACLE });
    expect(summary.tier).toBe('oracle');
  });

  it('does not let one literature band lift a module out of indices-only', () => {
    expect(summarise({ a: UNSOURCED, b: UNSOURCED }).tier).toBe('unsourced');
    expect(summarise({ a: UNSOURCED, b: LITERATURE }).tier).toBe('literature');
  });

  it('counts corroboration as everything that is not unsourced', () => {
    const summary = summarise({ a: ORACLE, b: LITERATURE, c: UNSOURCED, d: UNSOURCED });
    expect(summary.percent).toBe(50);
    expect(summary.total).toBe(4);
  });

  it('names the Pulse engine only where a trace actually corroborates a band', () => {
    expect(summarise({ a: ORACLE }).sentence).toMatch(/Pulse Physiology Engine/);
    expect(summarise({ a: LITERATURE }).sentence).not.toMatch(/Pulse/);
  });

  it('says the dynamic response is unchecked when nothing external corroborates it', () => {
    // The claim a reviewer would otherwise infer from "anchored to published intervals" is
    // exactly the one this module cannot make, so it is denied explicitly.
    expect(summarise({ a: LITERATURE }).sentence).toMatch(/has not been checked against an independent engine/);
  });

  it('always names the unsourced tail, and never invents one', () => {
    expect(summarise({ a: LITERATURE, b: UNSOURCED }).sentence).toMatch(/1 of 2 quantities is an index/);
    expect(summarise({ a: LITERATURE }).sentence).not.toMatch(/index with no published interval/);
  });

  it('agrees the noun with the set and the verb with the count', () => {
    // "1 of 6 quantity is" reads as a typo in a footnote whose whole job is to look careful.
    expect(summarise({ a: LITERATURE, b: UNSOURCED, c: UNSOURCED }).sentence).toMatch(/2 of 3 quantities are/);
    expect(summarise({ a: UNSOURCED, b: LITERATURE }).sentence).toMatch(/1 of 2 quantities is/);
  });

  it('survives a module with no bands rather than dividing by zero', () => {
    const summary = summarise({});
    expect(summary.percent).toBe(0);
    expect(summary.total).toBe(0);
  });

  it('gives every tier a badge short enough for a table cell', () => {
    for (const tier of ['oracle', 'literature', 'unsourced'] as const) {
      expect(tierLabel(tier).length).toBeLessThan(24);
    }
  });
});
