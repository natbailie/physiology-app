import { BUSINESS } from './business';
import type { LegalDoc } from './types';

/**
 * Interim accessibility statement, in the GDS model format.
 *
 * `#review-h` is the private audit trail shared by URL; this is what a university's own
 * statement points at. Strictly, PSBAR 2018 binds the university, not us — our own direct duty
 * is the Equality Act 2010 anticipatory duty (and, for the phone app, the same).
 *
 * Two things this statement must never do: invent a calendar commitment (every timing is tied
 * to the external audit, an event, not a date), and claim an audit that has not run.
 */
export const ACCESSIBILITY: LegalDoc = {
  id: 'accessibility',
  title: 'Accessibility statement',
  summary:
    'Interim. How accessible Physiology Lab is, what is still being checked, and what to do if you have difficulty using it.',
  lastUpdated: '2026-09-28',
  sections: [
    {
      heading: 'Scope',
      paragraphs: [
        'This statement applies to the Physiology Lab website and the Physiology phone app for iOS and Android.',
      ],
    },
    {
      heading: 'Compliance status',
      paragraphs: [
        'The website and the app are partially compliant with the Web Content Accessibility Guidelines version 2.2, level AA. Partially compliant means some parts of the content do not yet fully meet the standard — they are listed below.',
        'The assessment so far is our own internal review: every colour contrast figure is computed from the shipped palette and asserted in the test suite, and the page structure, focus handling, control labels and high-contrast behaviour have been reworked against that review. What has not happened yet is an independent audit with assistive technology, and this statement does not claim otherwise.',
      ],
    },
    {
      heading: 'What already works',
      list: [
        'Body text meets the 4.5:1 contrast floor and control boundaries the 3:1 floor, in both themes, on every surface text sits on.',
        'Every route has a main landmark, a page title of its own and a skip link that moves focus to the content; decorative symbols are hidden from screen readers.',
        'Moving between pages moves keyboard and screen-reader focus to the new page.',
        'Errors and confirmations — signing in, redeeming a code, answering a question — are announced to screen readers.',
        'Diagrams and charts carry a text description of what they show.',
        'Sliders announce their meaning (such as "Normal" or "Intact"), not just a number.',
        'Glossary definitions open on hover, focus or tap, stay open while you read them, and close with Escape.',
        'Answer shortcut keys only work while focus is inside the question, so they cannot fire by accident.',
        'Focused controls scroll clear of the sticky header and the bottom controls rather than underneath them.',
        'A forced-colours baseline keeps focus, sliders and meters readable in Windows High Contrast mode.',
        'Motion respects the reduced-motion setting.',
        'The tutor announces its answers to screen readers as they stream.',
        'Signing in works with a password manager and sets no puzzle.',
        'In the phone app, buttons and fields are labelled for VoiceOver and TalkBack, text follows your system text size, and touch targets are at least 44 points.',
      ],
    },
    {
      heading: 'What is still being checked',
      paragraphs: [
        'The areas below are untested for compliance — no failures are known here, and none are asserted. Each will be confirmed or fixed through the independent external audit — keyboard-only, NVDA, JAWS, VoiceOver and TalkBack, 400% zoom, 320px reflow and forced colours — which runs before the first institutional sale. No calendar date is stated because the audit, not this page, sets the timetable.',
      ],
      list: [
        'Full keyboard-only pass over the home round and every module tab.',
        'Screen-reader pass over the simulators, patients tabs and practice questions.',
        '400% zoom and 320px-width reflow without loss of content or function.',
        'Diagram legibility in forced-colours mode, where hue-only distinctions are replaced.',
        'Small diagram labels in the phone app at the largest system text sizes.',
        'A published VPAT covering WCAG 2.2 AA, EN 301 549 and Section 508.',
      ],
    },
    {
      heading: 'Feedback and contact',
      paragraphs: [
        `If you find any problem not listed on this page, or you need information on this page in a different format, email ${BUSINESS.contactEmail} with "Accessibility" in the subject. We will acknowledge it within 5 working days and tell you what we will do.`,
        'If you use Physiology Lab through your course, your university or college disability support service can also raise it with us on your behalf.',
      ],
      links: [
        { label: `Email ${BUSINESS.contactEmail}`, href: `mailto:${BUSINESS.contactEmail}?subject=Accessibility` },
      ],
    },
    {
      heading: 'Enforcement procedure',
      paragraphs: [
        'The Equality and Human Rights Commission enforces accessibility in England, Scotland and Wales, and the Equality Commission for Northern Ireland in Northern Ireland. If you are unhappy with our response, contact the Equality Advisory and Support Service — or, in Northern Ireland, the Equality Commission for Northern Ireland — and they will advise on the next step.',
      ],
    },
    {
      heading: 'Disproportionate burden and scope',
      paragraphs: [
        'No disproportionate burden is claimed. No content is claimed to sit outside the scope of the accessibility regulations.',
      ],
    },
    {
      heading: 'Preparation of this statement',
      paragraphs: [
        'Prepared on 14 September 2026 from an internal self-assessment. Last tested on 28 September 2026: contrast computed from the shipped palette and asserted in the test suite, plus structural review of landmarks, page titles, focus handling, live announcements, control labels, target sizes and high-contrast behaviour on the website, and labels, roles and announcements in the phone app. It will be reviewed and re-dated when the external audit completes.',
      ],
    },
    {
      heading: 'What this is not',
      paragraphs: [
        'This is a teaching tool for pre-clinical physiology. It is not a medical device, not a clinical decision support system, and nothing in it should be used to make a decision about a patient. Patients in the app are fictional.',
      ],
    },
  ],
};
