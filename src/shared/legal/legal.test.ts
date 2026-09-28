import { describe, expect, it } from 'vitest';
import { LEGAL_DOCS, LEGAL_DOC_ORDER } from './index';
import { BUSINESS, LEGAL_PLACEHOLDERS, isPlaceholder } from './business';
import { PROCESSORS } from './processors';
import { PERSONAL_DATA_STORES, PRIVACY } from './privacy';
import { STORAGE_ITEMS, CONSENT_STORAGE_KEY } from './cookies';
import type { LegalDoc } from './types';

const textOf = (doc: LegalDoc): string =>
  doc.sections
    .flatMap((s) => [
      s.heading,
      ...(s.paragraphs ?? []),
      ...(s.list ?? []),
      ...(s.closing ?? []),
      ...(s.table ? [...s.table.head, ...s.table.rows.flat()] : []),
    ])
    .join('\n');

describe('legal documents', () => {
  it.each(Object.values(LEGAL_DOCS))('$id has a title, a date and content', (doc) => {
    expect(doc.title.length).toBeGreaterThan(3);
    expect(doc.summary.length).toBeGreaterThan(10);
    expect(doc.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(doc.sections.length).toBeGreaterThan(0);
    for (const section of doc.sections) {
      const body = (section.paragraphs?.length ?? 0) + (section.list?.length ?? 0) + (section.table ? 1 : 0);
      expect(body, `${doc.id} › ${section.heading} is empty`).toBeGreaterThan(0);
    }
  });

  it('lists every document in the footer order exactly once', () => {
    expect([...LEGAL_DOC_ORDER].sort()).toEqual(Object.keys(LEGAL_DOCS).sort());
  });

  it('names every processor in the privacy policy', () => {
    const text = textOf(PRIVACY);
    for (const processor of PROCESSORS) expect(text).toContain(processor.name);
  });

  it('describes every store of personal data in the privacy policy', () => {
    const text = textOf(PRIVACY);
    for (const store of PERSONAL_DATA_STORES) expect(text, store).toContain(store);
  });

  it('never claims that no third party receives data', () => {
    for (const doc of Object.values(LEGAL_DOCS)) {
      expect(textOf(doc)).not.toMatch(/no third part(y|ies) (receiv|get|see)/i);
    }
  });

  it('gives the ICO complaint route and the controller identity', () => {
    const text = textOf(PRIVACY);
    expect(text).toMatch(/Information Commissioner/);
    expect(text).toContain(BUSINESS.legalName);
    expect(text).toContain(BUSINESS.privacyEmail);
  });

  it('lists the consent key in the cookie table', () => {
    expect(STORAGE_ITEMS.map((row) => row[0])).toContain(CONSENT_STORAGE_KEY);
  });

  it('marks unfilled business details as placeholders, not invented values', () => {
    // Every field is either a placeholder or a value somebody actually chose. The list is
    // what the pre-launch checklist ticks off.
    for (const field of LEGAL_PLACEHOLDERS) expect(isPlaceholder(BUSINESS[field])).toBe(true);
  });
});
