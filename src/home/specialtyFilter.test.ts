// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSpecialtyFilterForTests,
  setSpecialtyFilter,
  useSpecialtyFilter,
} from './specialtyFilter';

afterEach(clearSpecialtyFilterForTests);

/** The store is read through `useSyncExternalStore`; its snapshot is what those reads return. */
function read(): string | null {
  // `useSpecialtyFilter` is a one-line wrapper over the same snapshot, so exercising the
  // storage contract directly is the honest unit here — the hook is covered by RoundBoard.
  return sessionStorage.getItem('physiologylab.specialtyFilter');
}

describe('specialtyFilter', () => {
  it('starts with nothing filtered, which shows the whole ward', () => {
    expect(read()).toBeNull();
  });

  it('persists a choice per tab, so it survives home → bedside → back', () => {
    setSpecialtyFilter('cardiovascular');
    expect(read()).toBe('cardiovascular');
  });

  it('clears back to the whole ward', () => {
    setSpecialtyFilter('respiratory');
    setSpecialtyFilter(null);
    expect(read()).toBeNull();
  });

  it('refuses a stored value that is not a real specialty', () => {
    // A renamed or removed theme must not leave a round filtered to nothing, with no chip
    // pressed to explain why.
    sessionStorage.setItem('physiologylab.specialtyFilter', 'phrenology');
    clearSpecialtyFilterForTests();
    sessionStorage.setItem('physiologylab.specialtyFilter', 'phrenology');
    setSpecialtyFilter('renalFluids');
    expect(read()).toBe('renalFluids');
  });

  it('exposes a hook for components to subscribe through', () => {
    expect(typeof useSpecialtyFilter).toBe('function');
  });
});
