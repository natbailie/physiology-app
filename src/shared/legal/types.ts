/**
 * A legal document as plain data.
 *
 * No JSX and no platform imports: the same objects are rendered by `src/legal/LegalPage.tsx` on
 * the web and by `app/legal/[doc].tsx` on the phone (this directory is synced verbatim), so the
 * two apps cannot drift into saying different things about the same contract.
 */
export type LegalDocId = 'privacy' | 'terms' | 'cookies' | 'refunds' | 'business' | 'accessibility';

/** A link inside a section. `route` is an in-app destination; `href` is an external URL or mailto. */
export type LegalLink =
  | { label: string; route: LegalDocId | 'pricing' | 'account' | 'reviews' | 'methodology' }
  | { label: string; href: string };

export interface LegalTable {
  head: readonly string[];
  rows: readonly (readonly string[])[];
}

export interface LegalSection {
  heading: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  table?: LegalTable;
  /** Paragraphs rendered after the list or table. */
  closing?: readonly string[];
  links?: readonly LegalLink[];
}

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  /** One sentence under the title. */
  summary: string;
  /** ISO date. Bump it whenever the substance of the document changes. */
  lastUpdated: string;
  sections: readonly LegalSection[];
}
