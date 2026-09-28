import { ACCESSIBILITY } from './accessibility';
import { BUSINESS_DETAILS } from './businessDetails';
import { COOKIES } from './cookies';
import { PRIVACY } from './privacy';
import { REFUNDS } from './refunds';
import { TERMS } from './terms';
import type { LegalDoc, LegalDocId } from './types';

export const LEGAL_DOCS: Readonly<Record<LegalDocId, LegalDoc>> = {
  privacy: PRIVACY,
  terms: TERMS,
  cookies: COOKIES,
  refunds: REFUNDS,
  business: BUSINESS_DETAILS,
  accessibility: ACCESSIBILITY,
};

/** Footer / settings order. */
export const LEGAL_DOC_ORDER: readonly LegalDocId[] = ['privacy', 'terms', 'cookies', 'refunds', 'accessibility', 'business'];

export const isLegalDocId = (value: string): value is LegalDocId => value in LEGAL_DOCS;

/** Short names for navigation lists. */
export const LEGAL_LINK_LABELS: Readonly<Record<LegalDocId, string>> = {
  privacy: 'Privacy',
  terms: 'Terms',
  cookies: 'Cookies',
  refunds: 'Refunds',
  accessibility: 'Accessibility',
  business: 'Business details',
};

export { BUSINESS, TERMS_VERSION, TRADER_LINE, LEGAL_PLACEHOLDERS } from './business';
