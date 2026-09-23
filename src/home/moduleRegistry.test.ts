import { describe, expect, it } from 'vitest';
import indexCss from '../index.css?raw';
import { PAGES } from '@/pages';
import { VALID_ROUTES } from '@/shared/hooks/useHashRoute';
import { DISCIPLINES, MODULES, THEMES } from './moduleRegistry';

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
    const utility = new Set(['account', 'accessibility', 'privacy', 'pricing', 'methodology', 'review-h', 'teacher']);
    const known = new Set(MODULES.map((module) => module.id));
    const themeRoutes = new Set(THEMES.map((theme) => `theme/${theme.id}`));
    const disciplineRoutes = new Set(DISCIPLINES.map((d) => `discipline/${d.id}`));
    const stray = VALID_ROUTES.filter(
      (id) =>
        !utility.has(id) && !known.has(id) && !themeRoutes.has(id) && !disciplineRoutes.has(id),
    );
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

describe('theme wiring', () => {
  const themeIds = new Set(THEMES.map((theme) => theme.id));

  it('gives every non-reference module a theme that exists', () => {
    for (const module of MODULES) {
      if (module.kind === 'reference') continue;
      expect(themeIds.has(module.theme!), `${module.id} has no valid theme (${module.theme})`).toBe(
        true,
      );
    }
  });

  it('keeps reference utility pages outside the simulator themes', () => {
    // The formula sheet is a single pinned page and must not masquerade as a theme. The
    // medications hub is the exception: it is a browseable collection that earns its own theme
    // tile, so it is the one reference entry allowed a theme.
    for (const module of MODULES) {
      if (module.kind !== 'reference') continue;
      if (module.id === 'medications') {
        expect(module.theme, 'the medications hub belongs to its own theme').toBe('medications');
      } else {
        expect(module.theme, 'reference lives outside the themes').toBeUndefined();
      }
    }
  });

  it('gives every theme a unique id', () => {
    expect(themeIds.size).toBe(THEMES.length);
  });

  it('gives every theme at least one module', () => {
    const assigned = new Set(MODULES.map((module) => module.theme));
    const empty = THEMES.filter((theme) => !assigned.has(theme.id)).map((t) => t.id);
    expect(empty.join(', '), `themes with no modules: ${empty.join(', ')}`).toBe('');
  });

  it('gives every theme a route the hash router accepts', () => {
    const routable = new Set<string>(VALID_ROUTES);
    const unreachable = THEMES.filter((theme) => !routable.has(`theme/${theme.id}`)).map((t) => t.id);
    expect(
      unreachable.join(', '),
      `these themes render a card but #hash falls back to home: ${unreachable.join(', ')}`,
    ).toBe('');
  });

  it('uses only accent colours that index.css actually defines', () => {
    const defined = new Set([...indexCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

    for (const theme of THEMES) {
      const name = theme.accentColorVar?.match(/var\((--[\w-]+)\)/)?.[1];
      if (!name) continue;
      expect(defined.has(name), `${theme.id} uses ${name}, which index.css does not define`).toBe(
        true,
      );
    }
  });
});

describe('discipline wiring', () => {
  const disciplineIds = new Set(DISCIPLINES.map((discipline) => discipline.id));
  const available = DISCIPLINES.filter((discipline) => discipline.status === 'available');

  it('gives every discipline a unique id', () => {
    expect(disciplineIds.size).toBe(DISCIPLINES.length);
  });

  it('puts every theme under a discipline that exists', () => {
    for (const theme of THEMES) {
      expect(
        disciplineIds.has(theme.discipline),
        `${theme.id} has no valid discipline (${theme.discipline})`,
      ).toBe(true);
    }
  });

  it('gives every available discipline somewhere to go', () => {
    // Either its own generated page, or an explicit href for the one whose only theme is
    // already a hub. A tile with neither is a dead tile.
    const routable = new Set<string>(VALID_ROUTES);
    const stranded = available
      .filter((discipline) => !discipline.href && !routable.has(`discipline/${discipline.id}`))
      .map((discipline) => discipline.id);
    expect(stranded.join(', '), `disciplines whose tile goes nowhere: ${stranded.join(', ')}`).toBe(
      '',
    );
  });

  it('does not route a discipline that names its own href', () => {
    // Otherwise `#discipline/pharmacology` exists as an orphan page holding a single tile.
    const routable = new Set<string>(VALID_ROUTES);
    const doubled = DISCIPLINES.filter(
      (discipline) => discipline.href && routable.has(`discipline/${discipline.id}`),
    ).map((discipline) => discipline.id);
    expect(doubled.join(', ')).toBe('');
  });

  it('gives every available discipline at least one theme', () => {
    const assigned = new Set(THEMES.map((theme) => theme.discipline));
    const empty = available.filter((discipline) => !assigned.has(discipline.id)).map((d) => d.id);
    expect(empty.join(', '), `available disciplines with no themes: ${empty.join(', ')}`).toBe('');
  });

  it('keeps coming-soon disciplines genuinely empty', () => {
    // A subject cannot ship content while still advertising itself as unreleased: the tile is
    // not a link, so anything filed under it is unreachable.
    const assigned = new Set(THEMES.map((theme) => theme.discipline));
    const stocked = DISCIPLINES.filter(
      (discipline) => discipline.status === 'comingSoon' && assigned.has(discipline.id),
    ).map((discipline) => discipline.id);
    expect(stocked.join(', '), `coming-soon disciplines with themes: ${stocked.join(', ')}`).toBe(
      '',
    );
  });

  it('uses only accent colours that index.css actually defines', () => {
    const defined = new Set([...indexCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

    for (const discipline of DISCIPLINES) {
      const name = discipline.accentColorVar?.match(/var\((--[\w-]+)\)/)?.[1];
      if (!name) continue;
      expect(
        defined.has(name),
        `${discipline.id} uses ${name}, which index.css does not define`,
      ).toBe(true);
    }
  });
});
