// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MedicationsPage } from './MedicationsPage';
import { FAMILIES, MEDICATIONS } from './drugs';

afterEach(cleanup);

function navigateTo(hash: string) {
  window.location.hash = hash;
}

describe('MedicationsPage family hub', () => {
  it('shows one tile per family, each linking to its family page', () => {
    navigateTo('#medications');
    render(<MedicationsPage />);
    expect(screen.getByRole('heading', { name: 'Medications' })).toBeTruthy();
    for (const family of FAMILIES.slice(0, 13)) {
      const link = screen.getByRole('link', { name: new RegExp(family.name, 'i') });
      expect(link.getAttribute('href')).toBe(`#medications/${family.id}`);
    }
  });

  it('tiles the family into class counts', () => {
    navigateTo('#medications');
    render(<MedicationsPage />);
    const family = FAMILIES[0]!;
    const link = screen.getByRole('link', { name: new RegExp(family.name, 'i') });
    expect(link.textContent).toContain(`${family.classCount}`);
  });
});

describe('MedicationsPage family page', () => {
  it('shows that family’s class tiles linking to each class route', () => {
    const family = FAMILIES[0]!;
    navigateTo(`#medications/${family.id}`);
    render(<MedicationsPage />);
    const members = MEDICATIONS.filter((d) => d.family === family.name);
    for (const drug of members.slice(0, 5)) {
      const link = screen.getByRole('link', { name: new RegExp(drug.className, 'i') });
      expect(link.getAttribute('href')).toBe(`#medications/${drug.id}`);
    }
  });

  it('does not leak classes from other families onto the page', () => {
    const family = FAMILIES[0]!;
    const other = MEDICATIONS.find((d) => d.family !== family.name)!;
    navigateTo(`#medications/${family.id}`);
    render(<MedicationsPage />);
    expect(screen.queryByRole('link', { name: new RegExp(other.className, 'i') })).toBeNull();
  });
});
