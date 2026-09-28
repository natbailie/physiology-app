import { BUSINESS } from './business';
import type { LegalDoc } from './types';

export const BUSINESS_DETAILS: LegalDoc = {
  id: 'business',
  title: 'Business details',
  summary: 'Who provides Physiology Lab and how to reach us.',
  lastUpdated: '2026-09-28',
  sections: [
    {
      heading: 'Provider',
      table: {
        head: ['', ''],
        rows: [
          ['Product', BUSINESS.productName],
          ['Trading name', BUSINESS.tradingName],
          ['Legal name', BUSINESS.legalName],
          ['Legal form', BUSINESS.entityType],
          ['Company number', BUSINESS.companyNumber],
          ['Address', BUSINESS.address],
          ['Registered office', BUSINESS.registeredOffice],
          ['VAT number', BUSINESS.vatNumber],
          ['ICO registration', BUSINESS.icoRegistration],
          ['Email', BUSINESS.contactEmail],
        ],
      },
    },
    {
      heading: 'Contact',
      paragraphs: [`Email ${BUSINESS.contactEmail}. We aim to reply within 5 working days.`],
      links: [{ label: `Email ${BUSINESS.contactEmail}`, href: `mailto:${BUSINESS.contactEmail}` }],
    },
  ],
};
