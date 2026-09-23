import { useEffect, useState } from 'react';
import { MODULES } from '@/home/moduleRegistry';
import type { ReferenceRanges } from '@/shared/validation/referenceRange';
import { summarise, tierLabel, type ProvenanceSummary } from '@/shared/validation/provenanceSummary';
import styles from './MethodologyPage.module.css';

/**
 * How this app's physiology is checked, and against what.
 *
 * This page exists for a reader the rest of the app is not written for: someone deciding whether
 * an institution should adopt it. It makes the case in the only way that survives scrutiny — by
 * naming the gaps alongside the coverage, and by linking the claim to artefacts in the repository
 * rather than to an adjective.
 *
 * The glob is EAGER here, unlike `ProvenanceNote`'s. This page is its own lazy chunk and exists to
 * show all fifty-one modules at once, so the citation copy is exactly what a visitor asked for.
 */

const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

const referenceModules = import.meta.glob<Record<string, unknown>>('../modules/*/engine/references.ts', {
  eager: true,
});

/**
 * Counted, never loaded. A non-eager glob is a record of path to loader, so the KEYS give the
 * committed trace count for free while the traces themselves — hundreds of kB of sampled
 * waveform — stay out of the bundle entirely.
 */
const tracePaths = Object.keys(import.meta.glob('../modules/*/engine/__oracle__/*.json'));
const TRACE_COUNT = tracePaths.length;
const TRACE_MODULES = new Set(tracePaths.map(moduleIdOf)).size;

function rangesIn(exports: Record<string, unknown>): ReferenceRanges | null {
  const found = Object.entries(exports).find(([name]) => /REFERENCE_RANGES$/.test(name));
  return (found?.[1] as ReferenceRanges) ?? null;
}

interface Row {
  id: string;
  name: string;
  summary: ProvenanceSummary;
}

function buildRows(): Row[] {
  const named = new Map(MODULES.map((module) => [module.id, module.name] as const));
  return Object.entries(referenceModules)
    .flatMap(([path, exports]) => {
      const id = moduleIdOf(path);
      const ranges = rangesIn(exports);
      if (!ranges) return [];
      return [{ id, name: named.get(id) ?? id, summary: summarise(ranges) }];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function MethodologyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => setRows(buildRows()), []);

  const totals = rows.reduce(
    (acc, row) => ({
      bands: acc.bands + row.summary.total,
      corroborated: acc.corroborated + row.summary.oracle + row.summary.literature,
      oracleModules: acc.oracleModules + (row.summary.tier === 'oracle' ? 1 : 0),
    }),
    { bands: 0, corroborated: 0, oracleModules: 0 },
  );
  const percent = totals.bands === 0 ? 0 : Math.round((totals.corroborated / totals.bands) * 100);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>How the physiology is checked</h1>
        <p className={styles.standfirst}>
          Every simulator in this app is a quantitative model, and every model can be wrong. This
          page says what each module has been checked against, what it has not, and where to look.
        </p>
      </header>

      <section className={styles.body}>
        <h2 className={styles.sectionTitle}>Three kinds of evidence</h2>
        <p className={styles.prose}>
          Agreeing with our own constants is not evidence. These are the three references we use
          instead, in descending order of how hard they are to fake.
        </p>

        <dl className={styles.tiers}>
          <div className={styles.tier}>
            <dt className={styles.tierTerm}>Published equations</dt>
            <dd className={styles.tierDetail}>
              The reference is a named equation, written out inside the test, importing nothing
              from the engine it checks. Thirteen modules have one — Nernst and Goldman,
              Michaelis-Menten, Henderson-Hasselbalch and the alveolar gas equation, Gordon-Huxley
              length-tension, Hill force-velocity, Guyton, Starling, Edelman, the clearance
              identities, Watson &amp; Yellott, Steinhausen. Some are identities that must hold for
              any input at all: the ECG module reproduces Einthoven&rsquo;s law against arbitrary
              dipoles to ten decimal places, which no amount of miscalibration could produce.
            </dd>
          </div>
          <div className={styles.tier}>
            <dt className={styles.tierTerm}>An independent engine</dt>
            <dd className={styles.tierDetail}>
              The reference is a recorded trace from the Pulse Physiology Engine, an independently
              built and separately validated model of the same physiology, published under Apache
              2.0 by Kitware with validation tables citing the clinical literature. {TRACE_COUNT}{' '}
              traces across {TRACE_MODULES} modules, each run verbatim from Pulse&rsquo;s own
              scenario library rather than authored by us.
            </dd>
          </div>
          <div className={styles.tier}>
            <dt className={styles.tierTerm}>Published reference intervals</dt>
            <dd className={styles.tierDetail}>
              The reference is a published interval a clinician can check. Every module has this,
              and the build fails if a module&rsquo;s resting baseline settles outside its own
              stated band.
            </dd>
          </div>
        </dl>

        <h2 className={styles.sectionTitle}>Why this is worth doing</h2>
        <p className={styles.prose}>
          The shock module agreed with Pulse almost exactly at rest &mdash; mean arterial pressure
          95.0 against 95.3, heart rate 71.7 against 72.0 &mdash; and was still teaching the
          inverse of its own lesson. Blood pressure fell in a straight line from the first
          millilitre lost, where the entire point of haemorrhage classification is that pressure is
          defended through the early classes and then collapses. A learner reading that curve would
          conclude that pressure tracks blood loss proportionally.
        </p>
        <p className={styles.prose}>
          A reference-interval check passed that module. Only the independent trace caught it, and
          the fault turned out to be two missing mechanisms rather than a mis-tuned constant. That
          is what this scheme is for, and it is why the gaps below are published rather than
          quietly carried.
        </p>

        <h2 className={styles.sectionTitle}>Where every module stands</h2>
        <p className={styles.prose}>
          {totals.corroborated} of {totals.bands} asserted quantities ({percent}%) name an external
          source. The remainder are indices rather than measured units, and each one records what
          would settle it. That percentage is asserted as a ratchet in the test suite and can only
          rise.
        </p>
        <p className={styles.prose}>
          {TRACE_MODULES} modules hold a committed Pulse trace, but only {totals.oracleModules} are
          marked engine-corroborated below. The difference is respiratory mechanics, and it is
          deliberate: that module&rsquo;s lesion severities are inputs a learner sets rather than
          values the model produces, so its trace checks that a disease is scaled and modelled as
          the same KIND of lesion an independent engine makes it — not that a particular number
          lands in a particular band. Calling that corroboration of a band would overstate it.
        </p>

        <table className={styles.table}>
          <caption className={styles.caption}>
            Provenance of every asserted physiological quantity, by module.
          </caption>
          <thead>
            <tr>
              <th scope="col">Module</th>
              <th scope="col">Strongest evidence</th>
              <th scope="col" className={styles.num}>Quantities</th>
              <th scope="col" className={styles.num}>Sourced</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={styles.rowHead}>
                  <a href={`#${row.id}`}>{row.name}</a>
                </th>
                <td>{tierLabel(row.summary.tier)}</td>
                <td className={styles.num}>{row.summary.total}</td>
                <td className={styles.num}>{row.summary.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className={styles.sectionTitle}>What this is not</h2>
        <p className={styles.prose}>
          This is a teaching tool for pre-clinical physiology. It is not a medical device, not a
          clinical decision support system, and nothing in it should be used to make a decision
          about a patient. Where a module simplifies &mdash; and every model simplifies &mdash; the
          module&rsquo;s own notes say so.
        </p>
      </section>
    </div>
  );
}
