/**
 * Who is selling this. Every trader-identity fact the legal pages print comes from here.
 *
 * Values still wrapped in `{{…}}` are unfilled PLACEHOLDERS. They are deliberate: a made-up
 * company number or address on a statutory page is worse than an obvious gap. `LEGAL_PLACEHOLDERS`
 * lists whatever is still unfilled, and `legal.test.ts` prints it, so the pre-launch checklist in
 * `docs/compliance/UK-COMPLIANCE.md` can be ticked off against something real.
 *
 * Required by: the Electronic Commerce (EC Directive) Regulations 2002 reg. 6 (name, geographic
 * address, email, company number, VAT number), the Consumer Contracts Regulations 2013 Sch. 2
 * (trader identity and address before a contract), the Companies Act 2006 / Company, LLP and
 * Business (Names and Trading Disclosures) Regulations 2015 if a limited company, and UK GDPR
 * art. 13 (controller identity and contact details).
 */
export const BUSINESS = {
  productName: 'Physiology Lab',
  tradingName: 'Bentara Medical',
  /** e.g. "Nat Bailie, trading as Bentara Medical" or "Bentara Medical Ltd". */
  legalName: '{{LEGAL_NAME}}',
  /** "sole trader" or "private limited company registered in England and Wales / Northern Ireland". */
  entityType: '{{ENTITY_TYPE}}',
  /** Companies House number, or "Not applicable (sole trader)". */
  companyNumber: '{{COMPANY_NUMBER}}',
  /** A geographic address (not a PO box). A service address is fine for a sole trader. */
  address: '{{GEOGRAPHIC_ADDRESS}}',
  /** Registered office, if a company and different from the address above. */
  registeredOffice: '{{REGISTERED_OFFICE_OR_SAME}}',
  contactEmail: '{{CONTACT_EMAIL}}',
  /** Can be the same mailbox; named separately because the privacy notice must give one. */
  privacyEmail: '{{PRIVACY_EMAIL}}',
  /** "Not VAT registered" until registered. */
  vatNumber: '{{VAT_NUMBER_OR_NOT_REGISTERED}}',
  /** ICO data protection fee registration reference (ZA……). */
  icoRegistration: '{{ICO_REGISTRATION_NUMBER}}',
  /** "England and Wales" or "Northern Ireland". */
  governingLaw: '{{GOVERNING_LAW_JURISDICTION}}',
} as const;

export type BusinessField = keyof typeof BUSINESS;

const PLACEHOLDER = /^\{\{[A-Z_]+\}\}$/;

export const isPlaceholder = (value: string): boolean => PLACEHOLDER.test(value);

/** The fields that still need a real value before launch. */
export const LEGAL_PLACEHOLDERS: readonly BusinessField[] = (Object.keys(BUSINESS) as BusinessField[]).filter(
  (field) => isPlaceholder(BUSINESS[field]),
);

/** The trader as one line, for footers and pre-contract information. */
export const TRADER_LINE = `${BUSINESS.productName} is provided by ${BUSINESS.legalName} (${BUSINESS.tradingName}), ${BUSINESS.address}. Contact: ${BUSINESS.contactEmail}.`;

/** Bumped when the Terms change in a way a learner must re-accept. Stored with the sign-up. */
export const TERMS_VERSION = '2026-09-28';
