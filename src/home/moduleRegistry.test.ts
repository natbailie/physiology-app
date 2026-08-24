import { describe, expect, it } from 'vitest';
import indexCss from '../index.css?raw';
import { PAGES } from '@/pages';
import { VALID_ROUTES } from '@/shared/hooks/useHashRoute';
import { MODULES } from './moduleRegistry';

/**
 * A module id has to appear in four places (see CLAUDE.md) and nothing checked that it did.
 *
 * The failure is silent by construction: `resolveHash` falls back to 'home' for any id it does
 * not recognise, so a module missing from `VALID_ROUTES` does not error — clicking its card just
 * leaves the learner on the dashboard. Six modules shipped that way. These assertions are the
 * loud version of that.
 */
const AVAILABLE = MODULES.filter((module) => module.status === 'available');

describe('module registry wiring', () => {
  it('lists at least the modules we know shipped', () => {
    expect(AVAILABLE.length).toBeGreaterThan(35);
  });

  it('gives every available module a route the hash router accepts', () => {
    const routable = new Set<string>(VALID_ROUTES);
    const unreachable = AVAILABLE.filter((module) => !routable.has(module.id)).map((m) => m.id);
    expect(
      unreachable.join(', '),
      `these modules render a card but #hash falls back to home: ${unreachable.join(', ')}`,
    ).toBe('');
  });

  it('gives every available module a page component to lazy-load', () => {
    const missing = AVAILABLE.filter((module) => !(module.id in PAGES)).map((m) => m.id);
    expect(
      missing.join(', '),
      `these modules have a route but no entry in PAGES: ${missing.join(', ')}`,
    ).toBe('');
  });

  it('routes nowhere the registry does not list', () => {
    // 'home' is the fallback and never appears in VALID_ROUTES; the rest are utility pages.
    const utility = new Set(['account', 'privacy', 'pricing']);
    const known = new Set(MODULES.map((module) => module.id));
    const stray = VALID_ROUTES.filter((id) => !utility.has(id) && !known.has(id));
    expect(stray.join(', ')).toBe('');
  });

  it('gives every module a unique id', () => {
    const ids = MODULES.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every `related` link at a module that exists and is not itself', () => {
    const known = new Set(MODULES.map((module) => module.id));
    for (const module of MODULES) {
      for (const link of module.related ?? []) {
        expect(known.has(link.id), `${module.id} links to unknown module ${link.id}`).toBe(true);
        expect(link.id, `${module.id} links to itself`).not.toBe(module.id);
      }
    }
  });

  it('uses only accent colours that index.css actually defines', () => {
    const defined = new Set([...indexCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

    for (const module of MODULES) {
      const name = module.accentColorVar?.match(/var\((--[\w-]+)\)/)?.[1];
      if (!name) continue;
      expect(defined.has(name), `${module.id} uses ${name}, which index.css does not define`).toBe(
        true,
      );
    }
  });
});
