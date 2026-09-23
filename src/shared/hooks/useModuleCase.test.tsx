// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { caseHref, caseIdFromHash, caseInputs, useBedside, useModuleCase, withCase } from './useModuleCase';

const CASES = [{ id: 'amina-marathon' }, { id: 'george-post-mi' }] as const;

let unmount: (() => void) | null = null;

afterEach(() => {
  act(() => unmount?.());
  unmount = null;
  window.location.hash = '';
});

/** Renders the hook and reports what it returned on the latest commit. */
function mount(): { current: () => { id: string } | null } {
  const host = document.createElement('div');
  const root = createRoot(host);
  let latest: { id: string } | null = null;
  function Probe() {
    latest = useModuleCase(CASES);
    return null;
  }
  act(() => root.render(<Probe />));
  unmount = () => root.unmount();
  return { current: () => latest };
}

describe('caseIdFromHash', () => {
  it('reads the case parameter', () => {
    expect(caseIdFromHash('#shockStates?case=amina-marathon')).toBe('amina-marathon');
  });

  it('is null for a plain module hash', () => {
    expect(caseIdFromHash('#shockStates')).toBeNull();
  });

  it('coexists with a shared scenario', () => {
    expect(caseIdFromHash('#shockStates?s=abc123&case=george-post-mi')).toBe('george-post-mi');
  });
});

describe('useModuleCase', () => {
  it('returns null when no case is named', () => {
    window.location.hash = '#shockStates';
    expect(mount().current()).toBeNull();
  });

  it('returns the named case', () => {
    window.location.hash = '#shockStates?case=amina-marathon';
    expect(mount().current()?.id).toBe('amina-marathon');
  });

  it('ignores a case id this module does not have', () => {
    window.location.hash = '#shockStates?case=someone-else';
    expect(mount().current()).toBeNull();
  });

  /**
   * The reason this hook owns a listener. `useHashRoute` resolves both of these to
   * 'shockStates', so its own setState bails out and the page never re-renders — without this
   * subscription the second patient would silently show the first one's banner.
   */
  it('follows a case-to-case move that does not change the route', () => {
    window.location.hash = '#shockStates?case=amina-marathon';
    const probe = mount();
    expect(probe.current()?.id).toBe('amina-marathon');

    act(() => {
      window.location.hash = '#shockStates?case=george-post-mi';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(probe.current()?.id).toBe('george-post-mi');
  });
});

describe('withCase', () => {
  it('leaves a link alone when there is no case', () => {
    expect(withCase('https://x/#shockStates', null)).toBe('https://x/#shockStates');
  });

  it('opens the query on a bare module link', () => {
    expect(withCase('https://x/#shockStates', 'amina-marathon')).toBe(
      'https://x/#shockStates?case=amina-marathon',
    );
  });

  it('appends to a link that already carries a scenario', () => {
    expect(withCase('https://x/#shockStates?s=abc', 'amina-marathon')).toBe(
      'https://x/#shockStates?s=abc&case=amina-marathon',
    );
  });
});

describe('caseInputs', () => {
  const defaults = { volume: 5000, contractility: 1 };
  const presets = { normal: {}, bleeding: { volume: 3600 } };

  it('is undefined off a case, so the module opens on its own defaults', () => {
    expect(caseInputs(null, defaults, presets)).toBeUndefined();
  });

  /** From DEFAULTS, never from what is loaded — the rule useScenarioPreset documents. */
  it('lays the patient over the module defaults', () => {
    expect(caseInputs({ preset: 'bleeding' as const }, defaults, presets)).toEqual({
      volume: 3600,
      contractility: 1,
    });
  });
});

describe('useBedside', () => {
  interface Harness {
    rerender: (patient: { id: string; preset: string } | null) => void;
    applied: string[];
    /** `applied.length` at each bed change, so ordering against `apply` is observable. */
    bedChanges: number[];
    stale: () => boolean;
    back: () => void;
  }

  function mountBedside(initial: { id: string; preset: string } | null): Harness {
    const host = document.createElement('div');
    const root = createRoot(host);
    const applied: string[] = [];
    const bedChanges: number[] = [];
    let latest: ReturnType<typeof useBedside<string>> | null = null;
    let patientSeen: { id: string; preset: string } | null = null;

    function Probe({ patient }: { patient: { id: string; preset: string } | null }) {
      patientSeen = patient;
      latest = useBedside(
        patient,
        (name) => applied.push(name),
        () => bedChanges.push(applied.length),
      );
      return null;
    }

    act(() => root.render(<Probe patient={initial} />));
    unmount = () => root.unmount();

    return {
      rerender: (patient) => act(() => root.render(<Probe patient={patient} />)),
      applied,
      bedChanges,
      stale: () => latest!.activePreset !== null && latest!.activePreset !== patientSeen?.preset,
      back: () => act(() => latest!.returnToBedside()),
    };
  }

  /**
   * The mount path is already handled by `useShareableInputs`'s seed, so re-applying here would
   * buy nothing and cost a second settle of the whole engine.
   */
  it('does not re-apply the bed the page mounted with', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    expect(h.applied).toEqual([]);
  });

  /**
   * The bug this hook exists to prevent, found by looking at the running app rather than by a
   * test: walking Amina -> George moves the hash without changing the route, so the page never
   * remounts and the mount-time seed cannot fire again. Without this the round showed George's
   * name over Amina's physiology — and the banner could not tell, because the patient was the
   * thing that changed.
   */
  it('loads the new patient when the bed changes under a mounted page', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender({ id: 'george', preset: 'cardiogenic' });
    expect(h.applied).toEqual(['cardiogenic']);
  });

  it('loads a patient arrived at from the plain catalogue route', () => {
    const h = mountBedside(null);
    h.rerender({ id: 'amina', preset: 'haemorrhagic' });
    expect(h.applied).toEqual(['haemorrhagic']);
  });

  it('does not reload a bed that merely re-renders', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender({ id: 'amina', preset: 'haemorrhagic' });
    expect(h.applied).toEqual([]);
  });

  it('leaves the banner unstale after a bed change', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender({ id: 'george', preset: 'cardiogenic' });
    expect(h.stale()).toBe(false);
  });

  /**
   * The bug this whole ref exists to prevent, in the form the Patients tab reaches it: the
   * picker clears to "all questions" and then comes back to the same bed. The guard used to
   * bail on a null patient WITHOUT writing the ref, so the return matched a stale id and the
   * physiology was never reloaded — her name over someone else's numbers, and `activePreset`
   * unmoved so the stale banner could not catch it either.
   */
  it('reloads a bed re-selected after the patient was cleared', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender(null);
    h.rerender({ id: 'amina', preset: 'haemorrhagic' });
    expect(h.applied).toEqual(['haemorrhagic']);
  });

  it('leaves the physiology alone when the bed is merely cleared', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender(null);
    expect(h.applied).toEqual([]);
  });

  it('ends a running session when the bed changes, before loading the new one', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender({ id: 'george', preset: 'cardiogenic' });
    // Recorded at applied.length === 0: the session ends BEFORE the new scenario is applied,
    // so a question cannot be mid-load against a patient who has already gone.
    expect(h.bedChanges).toEqual([0]);
  });

  it('ends a running session when the bed is cleared', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.rerender(null);
    expect(h.bedChanges).toEqual([0]);
  });

  it('does not announce a bed change for the bed the page mounted with', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    expect(h.bedChanges).toEqual([]);
  });

  it('puts the patient back after the learner has explored elsewhere', () => {
    const h = mountBedside({ id: 'amina', preset: 'haemorrhagic' });
    h.back();
    expect(h.applied).toEqual(['haemorrhagic']);
    expect(h.stale()).toBe(false);
  });
});

describe('caseHref', () => {
  it('opens the query on a bare module hash', () => {
    expect(caseHref('#shockStates', 'amina-trauma')).toBe('#shockStates?case=amina-trauma');
  });

  it('replaces the bed already named', () => {
    expect(caseHref('#shockStates?case=amina-trauma', 'george-post-mi')).toBe(
      '#shockStates?case=george-post-mi',
    );
  });

  it('clears back to the bare module for "all questions"', () => {
    expect(caseHref('#shockStates?case=amina-trauma', null)).toBe('#shockStates');
  });

  /** A page opened from a share link carries the scenario that reproduces it. Changing bed must
   *  not quietly truncate the address bar. */
  it('keeps a shared scenario alongside the bed', () => {
    expect(caseHref('#shockStates?s=abc123', 'amina-trauma')).toBe(
      '#shockStates?s=abc123&case=amina-trauma',
    );
    expect(caseHref('#shockStates?s=abc123&case=amina-trauma', null)).toBe('#shockStates?s=abc123');
  });

  it('survives a hash with no leading #', () => {
    expect(caseHref('shockStates', 'amina-trauma')).toBe('#shockStates?case=amina-trauma');
  });
});
