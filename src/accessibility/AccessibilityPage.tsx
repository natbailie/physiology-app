import styles from './AccessibilityPage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

/**
 * Interim accessibility statement for Physiology Lab.
 *
 * The working paper's public counterpart, not the working paper: `#review-h` is the
 * private audit trail shared by URL, and this page is what a university's own
 * accessibility statement points at. Strictly, PSBAR 2018 binds the university, not
 * Bentara — Bentara's own direct duty is the Equality Act 2010 anticipatory duty.
 * It follows the GDS model format — compliance status, what is not
 * yet accessible, feedback route, enforcement, preparation — but it is marked interim
 * throughout, because no assistive-technology audit has run yet and this page must not
 * read as the report of one.
 *
 * Two things this page must never do: invent a calendar commitment (every timing is tied
 * to the external audit, an event, not a date), and invent a contact channel (no support
 * address exists in the product yet, so the feedback route says exactly that).
 */
export function AccessibilityPage() {
  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>Accessibility statement</h1>
        <p className={styles.standfirst}>
          <strong>Interim.</strong> How accessible Physiology Lab is, what is still being
          checked, and what to do if you have difficulty using it.
        </p>
      </header>

      <section className={styles.body}>
        <h2 className={styles.sectionTitle}>Scope</h2>
        <p className={styles.prose}>
          This statement applies to the Physiology Lab website. It does not cover the
          separate native mobile apps.
        </p>

        <h2 className={styles.sectionTitle}>Compliance status</h2>
        <p className={styles.prose}>
          This website is <strong>partially compliant</strong> with the Web Content
          Accessibility Guidelines version 2.2, level AA. Partially compliant means some
          parts of the content do not yet fully meet the standard — they are listed below.
        </p>
        <p className={styles.prose}>
          The assessment so far is our own internal review: every colour contrast figure is
          computed from the shipped palette and asserted in the test suite, and the page
          structure, focus handling, control labels and high-contrast behaviour have been
          reworked against that review. What has not happened yet is an independent audit
          with assistive technology, and this statement does not claim otherwise.
        </p>

        <h2 className={styles.sectionTitle}>What already works</h2>
        <ul className={styles.list}>
          <li>Body text meets the 4.5:1 contrast floor and control boundaries the 3:1 floor, in both themes.</li>
          <li>Every route has a main landmark and a skip link; decorative symbols are hidden from screen readers.</li>
          <li>Sliders announce their meaning (such as “Normal” or “Intact”), not just a number.</li>
          <li>Focused controls scroll clear of the sticky header rather than underneath it.</li>
          <li>A forced-colours baseline keeps focus, sliders and meters readable in Windows High Contrast mode.</li>
          <li>Motion respects the reduced-motion setting.</li>
          <li>The tutor announces its answers to screen readers as they stream.</li>
          <li>Signing in works with a password manager and sets no puzzle.</li>
        </ul>

        <h2 className={styles.sectionTitle}>What is still being checked</h2>
        <p className={styles.prose}>
          The areas below are untested for compliance — no failures are known here, and
          none are asserted. Each will be confirmed or fixed through the independent
          external audit — keyboard-only, NVDA, JAWS and VoiceOver, 400% zoom, 320px
          reflow and forced colours — which runs before the first institutional sale. No
          calendar date is stated because the audit, not this page, sets the timetable.
        </p>
        <ul className={styles.list}>
          <li>Full keyboard-only pass over the home round and every module tab.</li>
          <li>Screen-reader pass over the simulators, patients tabs and practice questions.</li>
          <li>400% zoom and 320px-width reflow without loss of content or function.</li>
          <li>Diagram legibility in forced-colours mode, where hue-only distinctions are replaced.</li>
          <li>A published VPAT covering WCAG 2.2 AA, EN 301 549 and Section 508.</li>
        </ul>

        <h2 className={styles.sectionTitle}>Feedback and contact</h2>
        <p className={styles.prose}>
          If you find any problem not listed on this page, or you need information on this
          page in a different format, raise it through the organisation that provides your
          access — your university or college disability support service if you use
          Physiology Lab through your course. There is not yet a direct accessibility
          contact point in the product; naming one, with a response-time commitment, is
          part of the work the external audit closes out.
        </p>

        <h2 className={styles.sectionTitle}>Enforcement procedure</h2>
        <p className={styles.prose}>
          The Equality and Human Rights Commission enforces accessibility in England,
          Scotland and Wales, and the Equality Commission for Northern Ireland in Northern
          Ireland. If you are unhappy with our response, contact the Equality Advisory
          and Support Service — or, in Northern Ireland, the Equality Commission for
          Northern Ireland — and they will advise on the next step.
        </p>

        <h2 className={styles.sectionTitle}>Disproportionate burden and scope</h2>
        <p className={styles.prose}>
          No disproportionate burden is claimed. No content on this website is claimed to
          sit outside the scope of the accessibility regulations.
        </p>

        <h2 className={styles.sectionTitle}>Preparation of this statement</h2>
        <p className={styles.prose}>
          Prepared on 14 September 2026 from an internal self-assessment. Last tested
          on 14 September 2026: contrast computed from the shipped palette and asserted
          in the test suite, plus structural review of landmarks, focus handling, control
          labels and high-contrast behaviour. It will be reviewed and re-dated when the
          external audit completes.
        </p>

        <h2 className={styles.sectionTitle}>What this is not</h2>
        <p className={styles.prose}>
          This is a teaching tool for pre-clinical physiology. It is not a medical device,
          not a clinical decision support system, and nothing in it should be used to make
          a decision about a patient. Fictional patient. Simplified teaching model — not a
          clinical tool.
        </p>
      </section>
    </div>
  );
}
