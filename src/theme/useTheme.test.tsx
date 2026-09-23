// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme, type ThemePreference } from './useTheme';
import { TOKENS } from './tokens.generated';

/** Drives the hook without a component tree of its own. */
function mountHook() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: ReturnType<typeof useTheme>;
  function Probe() {
    latest = useTheme();
    return null;
  }
  act(() => root.render(<Probe />));
  return {
    get current() {
      return latest!;
    },
    choose(next: ThemePreference) {
      act(() => latest!.choose(next));
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

let prefersDark = false;
const listeners = new Set<() => void>();

beforeEach(() => {
  prefersDark = false;
  listeners.clear();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  document.head.appendChild(meta);
  vi.stubGlobal('matchMedia', (query: string) => ({
    // A getter, not a snapshot: the hook holds on to the MediaQueryList it registered against
    // and reads `matches` when the listener fires, exactly as a browser's does.
    get matches() {
      return query.includes('dark') && prefersDark;
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
});

afterEach(() => {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  vi.unstubAllGlobals();
});

describe('useTheme', () => {
  it('defaults to dark, not to the device, when nothing has been chosen', () => {
    // A light machine must still open dark: this is an instrument console, and the default
    // is a product decision rather than a deference to the OS.
    prefersDark = false;
    const hook = mountHook();

    expect(hook.current.preference).toBe('dark');
    expect(hook.current.resolved).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    hook.unmount();
  });

  it('persists an explicit choice', () => {
    const hook = mountHook();

    hook.choose('dark');

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    hook.unmount();
  });

  /** A learner who has chosen must not have it taken away at dusk. */
  it('ignores the device once a choice has been made', () => {
    const hook = mountHook();
    hook.choose('light');

    prefersDark = true;
    act(() => listeners.forEach((fn) => fn()));

    expect(hook.current.resolved).toBe('light');
    hook.unmount();
  });

  /**
   * Auto has to survive a reload, which is the whole reason 'system' is written rather than
   * cleared. Removing the key would now read back as the dark DEFAULT, so a learner who chose
   * Auto would find themselves pinned to dark the next time they opened the app — the one
   * state the three-way control exists to keep reachable.
   */
  it('stores auto as a value, so it is not mistaken for the dark default', () => {
    localStorage.setItem('theme', 'dark');
    const hook = mountHook();
    expect(hook.current.resolved).toBe('dark');

    hook.choose('system');

    expect(localStorage.getItem('theme')).toBe('system');
    expect(hook.current.resolved).toBe('light');
    hook.unmount();
  });

  it('reads a stored auto back as auto', () => {
    localStorage.setItem('theme', 'system');
    prefersDark = true;
    const hook = mountHook();

    expect(hook.current.preference).toBe('system');
    expect(hook.current.resolved).toBe('dark');
    hook.unmount();
  });

  it('tracks the device changing while on auto', () => {
    localStorage.setItem('theme', 'system');
    const hook = mountHook();
    expect(hook.current.resolved).toBe('light');

    prefersDark = true;
    act(() => listeners.forEach((fn) => fn()));

    expect(hook.current.resolved).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    hook.unmount();
  });

  it('keeps the browser chrome colour in step with the page', () => {
    const hook = mountHook();

    hook.choose('dark');

    // Against the generated token rather than a literal. A fourth copy of the ground colour
    // is a fourth thing to forget — themeColor.test.ts exists because the other three drifted.
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      TOKENS.dark['--bg'],
    );
    hook.unmount();
  });
});
