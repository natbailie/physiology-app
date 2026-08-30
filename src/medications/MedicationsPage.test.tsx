// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MedicationsPage } from './MedicationsPage';
import { FAMILIES, MEDICATIONS, MICRO_GROUPS, MOA_GROUPS, getMoaClasses } from './drugs';

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

describe('MedicationsPage infection tiers', () => {
  it('shows the four antimicrobial branch tiles on the infection family page (not classes)', () => {
    navigateTo('#medications/infection');
    render(<MedicationsPage />);
    for (const micro of MICRO_GROUPS) {
      const link = screen.getByRole('link', { name: new RegExp(`^\\s*${micro.name}`, 'i') });
      expect(link.getAttribute('href')).toBe(`#medications/infection/${micro.id}`);
    }
    // An Infection class should not be reachable directly from the family page.
    const anInfectionClass = MEDICATIONS.find((d) => d.family === 'Infection')!;
    expect(
      screen.queryByRole('link', { name: new RegExp(anInfectionClass.className, 'i') }),
    ).toBeNull();
  });

  it('shows the mechanism-of-action tiles on the antibiotics branch', () => {
    navigateTo('#medications/infection/antibiotics');
    render(<MedicationsPage />);
    for (const moa of MOA_GROUPS) {
      const link = screen.getByRole('link', { name: new RegExp(moa.name, 'i') });
      expect(link.getAttribute('href')).toBe(`#medications/infection/antibiotics/${moa.id}`);
    }
  });

  it('shows the classes under a chosen mechanism of action', () => {
    navigateTo('#medications/infection/antibiotics/cell-wall');
    render(<MedicationsPage />);
    for (const drug of getMoaClasses('cell-wall')) {
      const link = screen.getByRole('link', { name: new RegExp(drug.className, 'i') });
      expect(link.getAttribute('href')).toBe(`#medications/${drug.id}`);
    }
  });

  it('shows the non-antibiotic branch classes without a further tier', () => {
    const branch = MICRO_GROUPS.find((g) => g.id === 'antivirals')!;
    navigateTo(`#medications/infection/${branch.id}`);
    render(<MedicationsPage />);
    const classes = MEDICATIONS.filter((d) => d.microGroup === branch.id);
    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    for (const drug of classes.slice(0, 3)) {
      expect(links).toContain(`#medications/${drug.id}`);
    }
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
