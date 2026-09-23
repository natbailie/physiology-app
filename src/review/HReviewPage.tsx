import { contrast, parseHex, type Rgb } from '@/shared/lib/color';
import { TOKENS } from '@/theme/tokens.generated';
import styles from './HReviewPage.module.css';

/**
 * The H preview series as a private working paper: what the five `tools/ui-preview/H-*`
 * mocks proposed, what was measured, what has been fixed, and what is still open.
 *
 * This page exists for two readers the rest of the app is not written for: an external
 * auditor, and a university buyer deciding whether the product can sit inside their
 * accessibility statement. It is deliberately NOT linked from anywhere in the app — it is
 * shared by URL into an audit or a procurement conversation.
 *
 * The contrast figures are not hand-typed. They are computed here, at render, from the
 * same generated token palette the test suite asserts (`TOKENS`), so they describe the
 * app as it is rather than as it was when this page was written. If a token changes and
 * this page is not touched, the numbers still move with it.
 */

type Theme = Record<string, Rgb>;

const toRgb = (theme: Readonly<Record<string, string>>): Theme =>
  Object.fromEntries(Object.entries(theme).map(([token, hex]) => [token, parseHex(hex)]));

const LIGHT = toRgb(TOKENS.light);
const DARK = toRgb(TOKENS.dark);

// Bare names — 'artery', not '--artery-base'.
const SIGNALS = Object.keys(LIGHT)
  .filter((k) => k.endsWith('-base'))
  .map((k) => k.replace(/^--/, '').replace(/-base$/, ''));

const ratio = (theme: Theme, foreground: string, surface: string): number =>
  contrast(theme[foreground]!, theme[surface]!);

/** The weakest signal against a surface, named — the figure an auditor checks first. */
function weakestSignal(theme: Theme, surface: string): { name: string; ratio: number } {
  let worst = { name: SIGNALS[0]!, ratio: Infinity };
  for (const name of SIGNALS) {
    const r = contrast(theme[`--${name}`]!, theme[surface]!);
    if (r < worst.ratio) worst = { name, ratio: r };
  }
  return worst;
}

/** The weakest `--on-solid` pairing: the solid signal it sits on, named. */
function weakestOnSolid(theme: Theme): { name: string; ratio: number } {
  const onSolid = theme['--on-solid']!;
  let worst = { name: SIGNALS[0]!, ratio: Infinity };
  for (const name of SIGNALS) {
    const r = contrast(onSolid, theme[`--${name}`]!);
    if (r < worst.ratio) worst = { name, ratio: r };
  }
  return worst;
}

const fmt = (n: number): string => `${n.toFixed(2)}:1`;

interface ContrastRow {
  item: string;
  light: string;
  dark: string;
  floor: string;
  passes: boolean;
  exempt?: boolean;
}

function buildContrastRows(): ContrastRow[] {
  const rows: ContrastRow[] = [];
  const textRamp: Array<[string, string, number]> = [
    ['Text on panel', '--text', 4.5],
    ['Dim text on panel', '--text-dim', 4.5],
    ['Faint text on panel', '--text-faint', 4.5],
  ];
  for (const [item, token, floor] of textRamp) {
    const l = ratio(LIGHT, token, '--panel');
    const d = ratio(DARK, token, '--panel');
    rows.push({ item, light: fmt(l), dark: fmt(d), floor: `${floor}:1`, passes: l >= floor && d >= floor });
  }
  const borderPanelL = ratio(LIGHT, '--panel-border', '--panel');
  const borderPanelD = ratio(DARK, '--panel-border', '--panel');
  rows.push({
    item: 'Panel border on panel',
    light: fmt(borderPanelL),
    dark: fmt(borderPanelD),
    floor: '3:1',
    passes: borderPanelL >= 3 && borderPanelD >= 3,
  });
  const borderBgL = ratio(LIGHT, '--panel-border', '--bg');
  const borderBgD = ratio(DARK, '--panel-border', '--bg');
  rows.push({
    item: 'Panel border on page ground',
    light: fmt(borderBgL),
    dark: fmt(borderBgD),
    floor: '3:1',
    passes: borderBgL >= 3 && borderBgD >= 3,
  });
  const onBrandL = ratio(LIGHT, '--on-solid', '--brand');
  const onBrandD = ratio(DARK, '--on-solid', '--brand');
  rows.push({
    item: 'Text on brand solid',
    light: fmt(onBrandL),
    dark: fmt(onBrandD),
    floor: '4.5:1',
    passes: onBrandL >= 4.5 && onBrandD >= 4.5,
  });
  const families: Array<[string, string, number]> = [
    ['Weakest signal as label text on panel', '--panel', 4.5],
    ['Weakest signal on page ground', '--bg', 3],
    ['Weakest signal on readout ink', '--readout-ink', 3],
  ];
  for (const [item, surface, floor] of families) {
    const l = weakestSignal(LIGHT, surface);
    const d = weakestSignal(DARK, surface);
    rows.push({
      item: `${item} (light ${l.name}, dark ${d.name})`,
      light: fmt(l.ratio),
      dark: fmt(d.ratio),
      floor: `${floor}:1`,
      passes: l.ratio >= floor && d.ratio >= floor,
    });
  }
  const solidL = weakestOnSolid(LIGHT);
  const solidD = weakestOnSolid(DARK);
  rows.push({
    item: `Text on solid signal, worst pairing (light ${solidL.name}, dark ${solidD.name})`,
    light: fmt(solidL.ratio),
    dark: fmt(solidD.ratio),
    floor: '4.5:1',
    passes: solidL.ratio >= 4.5 && solidD.ratio >= 4.5,
  });
  // Deliberately exempt: axis gridlines inside the four plot modules are furniture, not
  // boundaries — the trace and its labels carry the meaning. Stated here so an auditor
  // sees it was considered, not missed.
  rows.push({
    item: 'Axis gridline on panel (exempt, plot furniture)',
    light: fmt(ratio(LIGHT, '--grid-line', '--panel')),
    dark: fmt(ratio(DARK, '--grid-line', '--panel')),
    floor: '—',
    passes: true,
    exempt: true,
  });
  return rows;
}

interface FailureRow {
  failure: string;
  figure: string;
  state: string;
}

const FAILURES: FailureRow[] = [
  {
    failure: 'Neutral border below the 1.4.11 non-text floor',
    figure: 'Light #dfe6ef on white 1.26:1; dark #1d3352 on panel 1.43:1',
    state: 'Fixed — Phase A',
  },
  {
    failure: 'Mock: control rail collapses below the diagram on mobile',
    figure: 'Rail 1,108px beneath the diagram at a 390px viewport',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'Mock: hardcoded sticky topbar offsets',
    figure: 'Guessed top 57px / 99px; the bar measures 159px at 390px',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'Mock: vital-slab border in the light theme',
    figure: '#33475f on #02070f, 2.12:1 against the 3:1 floor',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'Mock: acuity glyphs as live text',
    figure: '▲ ● ✓ ○ ◔ ℞ announced literally by screen readers',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'Mock: word-valued sliders with no text alternative',
    figure: 'Intact, Normal, 1 day — raw number announced (4.1.2)',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'Mock: duplicated theme control and hidden tab bar',
    figure: 'Two groups labelled Theme; apptabs aria-hidden',
    state: 'Repaired in the mocks — Phase A',
  },
  {
    failure: 'No landmarks or skip link in the app',
    figure: 'Zero hits for main, skip, or a shared sr-only utility in src/',
    state: 'Open — Tranche 2',
  },
  {
    failure: 'Focus obscured by stacked sticky chrome (2.4.11)',
    figure: 'Sticky chrome 1,017px — 120% of a 390×844 viewport',
    state: 'Open — Tranche 2',
  },
  {
    failure: 'Word-valued sliders across all 51 modules',
    figure: 'Shared Slider exposes the raw number only; no aria-valuetext',
    state: 'Open — Tranche 2',
  },
  {
    failure: 'Decorative glyphs announced in the round',
    figure: 'RoundBoard and StudyReport print unhidden glyphs',
    state: 'Open — Tranche 2',
  },
  {
    failure: 'No forced-colours handling',
    figure: 'Zero hits for forced-colors or prefers-contrast in src/',
    state: 'Open — Tranche 2',
  },
  {
    failure: 'Accessibility statement still interim',
    figure: '#accessibility lives; dated commitments, the audit report and the VPAT wait on the external audit',
    state: 'Open — Tranche 3',
  },
  {
    failure: 'No audit with assistive technology',
    figure: 'Never tested with keyboard only, NVDA/JAWS/VoiceOver, 400% zoom, 320px',
    state: 'Open — Tranche 3',
  },
  {
    failure: 'No VPAT / Accessibility Conformance Report',
    figure: 'Nothing covering WCAG 2.2 AA, EN 301 549, or Section 508',
    state: 'Open — Tranche 3',
  },
];

export function HReviewPage() {
  const contrastRows = buildContrastRows();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>H preview series — accessibility review</h1>
        <p className={styles.standfirst}>
          A private working paper on the five <code>tools/ui-preview/H-*</code> mocks and the
          shipped app they restyle. It describes the app as it stands after the Phase A border
          fix and mock repairs, names every measured failure with its figure, and lists what is
          still open. It is not linked from anywhere in the app; it is shared by URL into an
          audit or a procurement conversation.
        </p>
      </header>

      <section className={styles.body}>
        <h2 className={styles.sectionTitle}>How this was measured</h2>
        <p className={styles.prose}>
          Every ratio in the contrast table is computed on this page, at render, from the same
          generated token palette the test suite asserts — WCAG relative luminance over the
          token values, both themes. If a token changes and this page is not touched, the
          numbers still move with it. Layout figures (sticky-chrome height, rail offset) were
          measured with <code>getBoundingClientRect()</code> in the preview at a 390×844
          viewport.
        </p>
        <p className={styles.prose}>
          What has <strong>not</strong> been tested, and is stated here rather than implied
          away: no keyboard-only pass, no screen-reader pass (NVDA, JAWS, VoiceOver), no 400%
          zoom, no 320px pass, no forced-colours pass. Colour is roughly one
          success-criterion family out of fifty. An external audit before the first
          institutional sale is Tranche 3, and its report — not this page — is the artefact
          that closes that gap.
        </p>

        <h2 className={styles.sectionTitle}>Contrast, computed from the shipped tokens</h2>
        <table className={styles.table}>
          <caption className={styles.caption}>
            WCAG ratios computed live from TOKENS.generated. Floors: 4.5:1 body text, 3:1
            non-text and large text.
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className={styles.num}>Light</th>
              <th scope="col" className={styles.num}>Dark</th>
              <th scope="col" className={styles.num}>Floor</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {contrastRows.map((row) => (
              <tr key={row.item}>
                <th scope="row" className={styles.rowHead}>
                  {row.item}
                </th>
                <td className={styles.num}>{row.light}</td>
                <td className={styles.num}>{row.dark}</td>
                <td className={styles.num}>{row.floor}</td>
                <td className={row.exempt ? styles.statusOpen : styles.statusPass}>
                  {row.exempt ? 'Exempt' : row.passes ? 'Pass' : 'Fail'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.prose}>
          The shipped failure this page was built around: the neutral border measured 1.26:1
          in light and 1.43:1 in dark against the 3:1 non-text floor, bounding every button,
          chip, range track, radio, and readout tile — while the suite tested the 93 signal
          colours and the text ramp but never the border. Phase A moved the border to the
          figures above and added the assertion that would have caught it.
        </p>

        <h2 className={styles.sectionTitle}>Failures, with their figures</h2>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Every measured failure. Mock defects were repaired in Phase A so the previews are
            a truthful spec; app defects are sequenced into Tranches 2 and 3.
          </caption>
          <thead>
            <tr>
              <th scope="col">Failure</th>
              <th scope="col">Figure</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {FAILURES.map((row) => (
              <tr key={row.failure}>
                <th scope="row" className={styles.rowHead}>
                  {row.failure}
                </th>
                <td>{row.figure}</td>
                <td className={row.state.startsWith('Open') ? styles.statusOpen : styles.statusPass}>
                  {row.state}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className={styles.sectionTitle}>Who is actually bound</h2>
        <p className={styles.prose}>
          The Public Sector Bodies Accessibility Regulations 2018 bind the university, not
          Bentara — but a licensed tool sits inside their statement, so the requirement
          arrives contractually through procurement. The Equality Act 2010 (sections 20 and
          29) binds Bentara directly and has no third-party exemption. Selling
          business-to-consumer into Ireland or the EU engages the European Accessibility Act,
          in force since 28 June 2025. The named US target engages the ADA Title II rule of
          April 2024 for public universities (WCAG 2.1 AA, effective 2026/2027) — hence the
          VPAT in Tranche 3. This is our stated legal position, not legal advice.
        </p>

        <h2 className={styles.sectionTitle}>What remains</h2>
        <dl className={styles.tiers}>
          <div className={styles.tier}>
              <dt className={styles.tierTerm}>Tranche 2 — accessibility structure in the app</dt>
              <dd className={styles.tierDetail}>
                Landmarks and a skip link, the 2.4.11 scroll-margin fix, shared-slider{' '}
                <code>aria-valuetext</code>, hidden decorative glyphs, and forced-colours
                handling — all landed; the keyboard and assistive-technology passes that
                verify them belong to the Tranche 3 audit.
              </dd>
          </div>
          <div className={styles.tier}>
              <dt className={styles.tierTerm}>Tranche 3 — what procurement asks for</dt>
              <dd className={styles.tierDetail}>
                The interim statement at #accessibility is live; what remains is the
                external audit, the dated commitments it sets, and the VPAT covering WCAG
                2.2 AA, EN 301 549, and Section 508.
              </dd>
          </div>
          <div className={styles.tier}>
            <dt className={styles.tierTerm}>Tranche 4 — commercial and visual (deferred)</dt>
            <dd className={styles.tierDetail}>
              Primary-action promotion, the phone frame, the competency map, the day-1
              state, list merging, vitals weighting, paywall status, search, palette warmth
              and wordmark, and type size. Sequenced after compliance, by leverage.
            </dd>
          </div>
        </dl>

        <h2 className={styles.sectionTitle}>What this is not</h2>
        <p className={styles.prose}>
          This is a teaching tool for pre-clinical physiology. It is not a medical device,
          not a clinical decision support system, and nothing in it should be used to make a
          decision about a patient. Fictional patient. Simplified teaching model — not a
          clinical tool.
        </p>
      </section>
    </div>
  );
}
