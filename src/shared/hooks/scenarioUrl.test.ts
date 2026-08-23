import { describe, expect, it } from 'vitest';
import { decodeScenario, diffFromDefaults, encodeScenario, routeIdFromHash } from './scenarioUrl';

interface Inputs {
  minuteVentilation: number;
  fiO2: number;
  acidType: 'anionGap' | 'hyperchloraemic';
  renalCapacity: number;
}

const DEFAULTS: Inputs = {
  minuteVentilation: 100,
  fiO2: 0.21,
  acidType: 'anionGap',
  renalCapacity: 1,
};

describe('routeIdFromHash', () => {
  it('reads a bare module hash', () => {
    expect(routeIdFromHash('#respiratory')).toBe('respiratory');
  });

  it('strips a scenario payload, so a shared link still resolves to its module', () => {
    expect(routeIdFromHash('#respiratory?s=abc123')).toBe('respiratory');
  });

  it('tolerates a hash with no leading marker', () => {
    expect(routeIdFromHash('respiratory')).toBe('respiratory');
  });
});

describe('encoding a scenario', () => {
  it('leaves an untouched module as a bare hash', () => {
    // Nothing to share is not the same as a scenario of defaults, and the short link is nicer.
    expect(encodeScenario('respiratory', DEFAULTS, DEFAULTS)).toBe('#respiratory');
  });

  it('carries only what differs from the defaults', () => {
    const changed: Inputs = { ...DEFAULTS, minuteVentilation: 30 };
    const decoded = decodeScenario(encodeScenario('respiratory', changed, DEFAULTS));
    expect(decoded?.inputs).toEqual({ minuteVentilation: 30 });
  });

  it('round-trips numbers, strings and booleans alike', () => {
    const changed: Inputs = { ...DEFAULTS, fiO2: 0.6, acidType: 'hyperchloraemic' };
    const decoded = decodeScenario(encodeScenario('respiratory', changed, DEFAULTS));
    expect(decoded?.inputs).toEqual({ fiO2: 0.6, acidType: 'hyperchloraemic' });
  });

  it('produces a link short enough to paste into a message', () => {
    const changed: Inputs = { ...DEFAULTS, minuteVentilation: 30, fiO2: 0.6 };
    expect(encodeScenario('respiratory', changed, DEFAULTS).length).toBeLessThan(120);
  });

  it('carries a preset name when one is given', () => {
    expect(decodeScenario(encodeScenario('respiratory', DEFAULTS, DEFAULTS, 'copd'))?.preset).toBe('copd');
  });
});

describe('decoding is never allowed to throw', () => {
  it('returns null for a bare module hash', () => {
    expect(decodeScenario('#respiratory')).toBeNull();
  });

  it('returns null for a truncated payload', () => {
    const full = encodeScenario('respiratory', { ...DEFAULTS, fiO2: 0.6 }, DEFAULTS);
    expect(decodeScenario(full.slice(0, full.length - 6))).toBeNull();
  });

  it('returns null for something that is not base64 at all', () => {
    expect(decodeScenario('#respiratory?s=!!!not base64!!!')).toBeNull();
  });

  it('returns null for valid base64 that is not a scenario', () => {
    expect(decodeScenario(`#respiratory?s=${btoa('hello there')}`)).toBeNull();
  });

  it('returns null for a payload from a version it does not understand', () => {
    const future = btoa(JSON.stringify({ v: 99, inputs: { fiO2: 0.6 } }));
    expect(decodeScenario(`#respiratory?s=${future}`)).toBeNull();
  });

  it('drops values that are not plain scalars, so a link cannot inject an object', () => {
    const hostile = btoa(JSON.stringify({ v: 1, inputs: { fiO2: 0.6, evil: { nested: true } } }));
    expect(decodeScenario(`#respiratory?s=${hostile}`)?.inputs).toEqual({ fiO2: 0.6 });
  });
});

describe('diffFromDefaults', () => {
  it('is empty when nothing has been touched', () => {
    expect(diffFromDefaults(DEFAULTS, DEFAULTS)).toEqual({});
  });

  it('survives a new input being added to a module', () => {
    // A link shared before `renalCapacity` existed decodes without it, and the module supplies
    // its default — which is why only the difference is encoded.
    const older = { minuteVentilation: 30 };
    const applied = { ...DEFAULTS, ...older };
    expect(applied.renalCapacity).toBe(1);
    expect(applied.minuteVentilation).toBe(30);
  });
});
