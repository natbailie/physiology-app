import { describe, expect, it } from 'vitest';
import {
  CLASS_IDS,
  FAMILIES,
  FAMILY_SLUGS,
  MEDICATIONS,
  MICRO_GROUPS,
  MOA_GROUPS,
  getDrugClass,
  getFamily,
  getMoaClasses,
  getMicroGroupClasses,
  MEDICATION_INVALID,
  resolveMedicationRoute,
} from './drugs';
import { MODULES } from '@/home/moduleRegistry';
import { VALID_ROUTES } from '@/shared/hooks/useHashRoute';
import { PAGES } from '@/pages';

describe('medications formulary data', () => {
  it('is a non-trivial list (the UK top-100)', () => {
    expect(MEDICATIONS.length).toBeGreaterThanOrEqual(100);
  });

  it('gives every class a unique, non-empty slug', () => {
    const ids = MEDICATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('lists at least one example drug per class', () => {
    for (const drug of MEDICATIONS) {
      expect(drug.drugs.length, drug.className).toBeGreaterThan(0);
    }
  });

  it('assigns every class to a known family', () => {
    const families = new Set(MEDICATIONS.map((c) => c.family));
    for (const drug of MEDICATIONS) {
      expect(families.has(drug.family), drug.className).toBe(true);
    }
  });

  it('writes a mechanism for every class, in the exam explainer voice', () => {
    for (const drug of MEDICATIONS) {
      expect(drug.mechanism, drug.className).toBeTruthy();
      expect(drug.mechanism!.length, `${drug.className} mechanism is too thin`).toBeGreaterThan(80);
    }
  });

  it('points every moduleId link at a real simulator module', () => {
    const moduleIds = new Set(MODULES.map((m) => m.id));
    for (const drug of MEDICATIONS) {
      if (!drug.moduleId) continue;
      expect(moduleIds.has(drug.moduleId), `${drug.className} links to unknown ${drug.moduleId}`).toBe(
        true,
      );
    }
  });

  it('CLASS_IDS matches the class list exactly', () => {
    expect(CLASS_IDS.size).toBe(MEDICATIONS.length);
    for (const drug of MEDICATIONS) {
      expect(CLASS_IDS.has(drug.id)).toBe(true);
    }
  });

  it('getDrugClass resolves every id and misses unknown ids', () => {
    for (const drug of MEDICATIONS) {
      expect(getDrugClass(drug.id)?.id).toBe(drug.id);
    }
    expect(getDrugClass('not-a-class')).toBeUndefined();
  });
});

describe('medications module wiring', () => {
  it('is an available reference module', () => {
    const module = MODULES.find((m) => m.id === 'medications');
    expect(module).toBeDefined();
    expect(module?.status).toBe('available');
  });

  it('has a hash route the router accepts', () => {
    expect(VALID_ROUTES).toContain('medications');
  });

  it('has a page component to lazy-load', () => {
    expect(PAGES).toHaveProperty('medications');
  });

  it('every class id is a routable sub-route', () => {
    for (const drug of MEDICATIONS) {
      // The hub validates `#medications/<id>` against CLASS_IDS before accepting the route, so
      // each class must be discoverable.
      expect(CLASS_IDS.has(drug.id)).toBe(true);
    }
  });
});

describe('medications families', () => {
  it('covers every class with a populated family tile', () => {
    const covered = new Set(MEDICATIONS.map((c) => c.family));
    for (const family of FAMILIES) {
      expect(covered.has(family.name), family.name).toBe(true);
      expect(family.classCount).toBeGreaterThan(0);
    }
    expect(FAMILIES).toHaveLength(13);
  });

  it('counts each family as the sum of its classes', () => {
    expect(FAMILIES.reduce((sum, f) => sum + f.classCount, 0)).toBe(MEDICATIONS.length);
  });

  it('FAMILY_SLUGS matches FAMILIES and misses unknown slugs', () => {
    expect(FAMILY_SLUGS.size).toBe(FAMILIES.length);
    for (const f of FAMILIES) expect(FAMILY_SLUGS.has(f.id)).toBe(true);
    expect(FAMILY_SLUGS.has('not-a-family')).toBe(false);
  });

  it('getFamily resolves every family and misses unknown ids', () => {
    for (const f of FAMILIES) expect(getFamily(f.id)?.id).toBe(f.id);
    expect(getFamily('not-a-family')).toBeUndefined();
  });

  it('keeps family slugs and class slugs disjoint (single route namespace)', () => {
    for (const id of CLASS_IDS) {
      expect(FAMILY_SLUGS.has(id), `${id} collides across families and classes`).toBe(false);
    }
  });
});

describe('medications de-grouping', () => {
  // Two pharmacologically distinct classes must never share one tile: each class is a plain,
  // separate tile, with its own drugs, mechanism and (where relevant) module link.
  it('separates the two-class pairings that used to share a tile', () => {
    const EXPECTED = [
      'Heparins',
      'Fondaparinux',
      'Acetylcysteine',
      'Carbocisteine',
      'Calcium',
      'Vitamin D',
      'Diuretics, thiazide',
      'Diuretics, thiazide-like',
      'Alginates',
      'Antacids',
      'Cephalosporins',
      'Carbapenems',
      'Tetracyclines',
      'Glycylcyclines',
      'NSAIDs',
      'COX-2 inhibitors',
      'Oestrogens',
      'Progestogens',
      'Vaccines',
      'Immunoglobulins',
    ];
    for (const expected of EXPECTED) {
      expect(
        MEDICATIONS.some((c) => c.className.includes(expected)),
        `expected a plain class tile for “${expected}”`,
      ).toBe(true);
    }
  });
});

describe('medications antimicrobial breadth', () => {
  const NAMES = MEDICATIONS.map((c) => c.className);

  it('carries the broad antiviral classification as plain classes', () => {
    for (const expected of [
      'nucleoside analogues (anti-herpes)',
      'nucleoside reverse-transcriptase inhibitors',
      'non-nucleoside reverse-transcriptase inhibitors',
      'protease inhibitors',
      'integrase inhibitors',
      'fusion and entry inhibitors',
      'neuraminidase inhibitors',
      'hepatitis',
    ]) {
      expect(
        NAMES.some((n) => n.toLowerCase().includes(expected)),
        `expected an antiviral class matching “${expected}”`,
      ).toBe(true);
    }
  });

  it('keeps the antiretroviral routes as separate tiles (no "and" groupings)', () => {
    for (const n of NAMES) {
      if (n.includes('antiretroviral')) {
        expect(n, n).not.toMatch(/ and | & |, and /i);
      }
    }
  });

  it('covers antibiotics, antifungals and antiparasitics broadly', () => {
    for (const expected of [
      'Sulfonamides',
      'Oxazolidinones',
      'Polymyxins',
      'Lipopeptides',
      'Rifamycins',
      'Antituberculous',
      'Azole antifungals',
      'Echinocandins',
      'Polyene antifungals',
      'Allylamine antifungals',
      'Antimalarials',
      'Anthelminthics',
    ]) {
      expect(
        MEDICATIONS.some((c) => c.className.includes(expected)),
        `expected a class for “${expected}”`,
      ).toBe(true);
    }
  });
});

describe('medications antimicrobial branches (Infection tiers)', () => {
  const infection = MEDICATIONS.filter((c) => c.family === 'Infection');

  it('tags every Infection class with exactly one of the four antimicrobial branches', () => {
    const branches = new Set<unknown>(MICRO_GROUPS.map((g) => g.id));
    for (const drug of infection) {
      expect(branches.has(drug.microGroup), drug.className).toBe(true);
    }
  });

  it('only Infection classes carry a microGroup', () => {
    for (const drug of MEDICATIONS) {
      if (drug.family !== 'Infection') {
        expect(drug.microGroup, drug.className).toBeUndefined();
      }
    }
  });

  it('gives every branch a non-empty tile of classes', () => {
    expect(MICRO_GROUPS).toHaveLength(4);
    for (const micro of MICRO_GROUPS) {
      expect(micro.classCount, micro.name).toBeGreaterThan(0);
    }
    expect(MICRO_GROUPS.reduce((sum, g) => sum + g.classCount, 0)).toBe(infection.length);
  });

  it('covers the four expected branch names', () => {
    const names = MICRO_GROUPS.map((g) => g.name);
    expect(names).toEqual([
      'Antibiotics',
      'Antivirals',
      'Antifungals',
      'Antiparasitics',
    ]);
  });

  it('getMicroGroupClasses lists exactly the classes of that branch', () => {
    for (const micro of MICRO_GROUPS) {
      const members = getMicroGroupClasses(micro.id);
      expect(members.length).toBe(micro.classCount);
      for (const drug of members) expect(drug.microGroup).toBe(micro.id);
    }
  });
});

describe('medications antibiotic mechanisms of action', () => {
  const antibiotics = MEDICATIONS.filter(
    (c) => c.microGroup === 'antibiotics',
  );

  it('gives every antibiotic class a mechanism-of-action group', () => {
    const moas = new Set<unknown>(MOA_GROUPS.map((m) => m.id));
    for (const drug of antibiotics) {
      expect(moas.has(drug.moa), drug.className).toBe(true);
    }
  });

  it('only antibiotic classes carry a moa', () => {
    for (const drug of MEDICATIONS) {
      if (drug.microGroup !== 'antibiotics') {
        expect(drug.moa, drug.className).toBeUndefined();
      }
    }
  });

  it('covers the classic mechanism-of-action buckets, each with classes', () => {
    // "Inhibit cell wall synthesis" is the example tier the learner meets; it must hold the
    // penicillins, cephalosporins, carbapenems and glycopeptides.
    expect(MOA_GROUPS.length).toBeGreaterThanOrEqual(5);
    for (const moa of MOA_GROUPS) {
      expect(moa.classCount, moa.name).toBeGreaterThan(0);
    }
    expect(MOA_GROUPS.reduce((sum, m) => sum + m.classCount, 0)).toBe(antibiotics.length);

    const cellWall = MOA_GROUPS.find((m) => m.id === 'cell-wall')!;
    const cellWallClasses = cellWall ? getMoaClasses(cellWall.id) : [];
    for (const expected of ['Penicillins', 'Cephalosporins', 'Carbapenems', 'Glycopeptide']) {
      expect(
        cellWallClasses.some((c) => c.className.includes(expected)),
        `expected “${expected}” under cell-wall synthesis`,
      ).toBe(true);
    }
  });
});

describe('medications infection route resolution', () => {
  it('resolves the deeper Infection branches, and only them', () => {
    expect(resolveMedicationRoute(['infection'])).toEqual({ kind: 'family', familyId: 'infection' });
    expect(resolveMedicationRoute(['infection', 'antibiotics'])).toEqual({
      kind: 'subfamily',
      familyId: 'infection',
      microGroup: 'antibiotics',
    });
    expect(resolveMedicationRoute(['infection', 'antivirals'])).toEqual({
      kind: 'subfamily',
      familyId: 'infection',
      microGroup: 'antivirals',
    });
    expect(resolveMedicationRoute(['infection', 'antibiotics', 'cell-wall'])).toEqual({
      kind: 'moa',
      familyId: 'infection',
      microGroup: 'antibiotics',
      moa: 'cell-wall',
    });
  });

  it('rejects non-Infection families with extra tiers', () => {
    const family = FAMILIES.find((f) => f.name !== 'Infection')!;
    expect(resolveMedicationRoute([family.id, 'antiviral'])).toBe(MEDICATION_INVALID);
    expect(resolveMedicationRoute([family.id, 'antiviral', 'cell-wall'])).toBe(MEDICATION_INVALID);
  });

  it('only routes non-antibiotic branches to three segments via a mechanism', () => {
    // A mechanism tier beneath a non-antibiotic branch names nothing real.
    expect(resolveMedicationRoute(['infection', 'antivirals', 'cell-wall'])).toBe(
      MEDICATION_INVALID,
    );
    expect(resolveMedicationRoute(['infection', 'antibiotics', 'cell-wall'])).not.toBe(
      MEDICATION_INVALID,
    );
    expect(resolveMedicationRoute(['infection', 'missing'])).toBe(MEDICATION_INVALID);
    expect(resolveMedicationRoute(['infection', 'antibiotics', 'missing'])).toBe(
      MEDICATION_INVALID,
    );
  });
});

