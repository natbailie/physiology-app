import { useEffect, useState } from 'react';
import type { ReferenceRanges } from '@/shared/validation/referenceRange';
import { summarise, tierLabel, type ProvenanceSummary } from '@/shared/validation/provenanceSummary';
import styles from './ProvenanceNote.module.css';

/**
 * Where this module's numbers came from, said on the module itself.
 *
 * Rendered once from `ModulePage` rather than by each of the fifty-one pages, for the same reason
 * the footnote is: a disclosure that a module can forget to include is not a disclosure.
 *
 * The loaders are LAZY. `references.ts` is otherwise absent from the bundle entirely — nothing
 * imports it at runtime, only the verification harness does — and eagerly globbing 265 citation
 * strings would weld every module's provenance copy into whichever chunk imports this file. A
 * learner who never expands the note pays for one small JSON-ish module, and only for the module
 * they are actually looking at.
 *
 * A module with no `references.ts` renders NOTHING rather than an empty note. That case cannot
 * currently happen — `references.test.ts` fails a module that opts out — but a silent absence is
 * the right failure if it ever does: a stub reading "no data" would be worse than saying nothing.
 */

const loaders = import.meta.glob<Record<string, unknown>>('../../../modules/*/engine/references.ts');

const pathFor = (moduleId: string) => `../../../modules/${moduleId}/engine/references.ts`;

/** Each module names its own const (`VENOUS_RETURN_REFERENCE_RANGES`), so it is found by shape. */
function rangesIn(exports: Record<string, unknown>): ReferenceRanges | null {
  const found = Object.entries(exports).find(([name]) => /REFERENCE_RANGES$/.test(name));
  return (found?.[1] as ReferenceRanges) ?? null;
}

interface Loaded {
  summary: ProvenanceSummary;
  ranges: ReferenceRanges;
}

export function ProvenanceNote({ moduleId }: { moduleId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let live = true;
    const load = loaders[pathFor(moduleId)];
    if (!load) return;
    void load().then((exports) => {
      const ranges = rangesIn(exports);
      if (live && ranges) setLoaded({ summary: summarise(ranges), ranges });
    });
    return () => {
      live = false;
    };
  }, [moduleId]);

  if (!loaded) return null;
  const { summary, ranges } = loaded;

  return (
    <details className={styles.note}>
      <summary className={styles.summary}>
        <span className={styles.badge} data-tier={summary.tier}>
          {tierLabel(summary.tier)}
        </span>
        <span className={styles.sentence}>{summary.sentence}</span>
      </summary>
      <dl className={styles.list}>
        {Object.entries(ranges).map(([key, range]) => (
          <div key={key} className={styles.row}>
            <dt className={styles.term}>
              {key}
              <span className={styles.band}>
                {range.low}–{range.high} {range.unit}
              </span>
            </dt>
            <dd className={styles.detail}>{describe(range.provenance)}</dd>
          </div>
        ))}
      </dl>
      <a className={styles.more} href="#methodology">
        How every module is checked
      </a>
    </details>
  );
}

function describe(provenance: ReferenceRanges[string]['provenance']): string {
  if (provenance.kind === 'oracle') {
    return `Pulse trace "${provenance.trace}" observed ${provenance.observed}. ${provenance.note}`;
  }
  if (provenance.kind === 'literature') {
    return provenance.citation;
  }
  return `No published interval applies yet. ${provenance.needs}`;
}
