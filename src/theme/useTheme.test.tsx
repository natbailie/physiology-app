// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme, type ThemePreference } from './useTheme';

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
  it('follows the device when nothing has been chosen', () => {
    prefersDark = true;
    const hook = mountHook();

    expect(hook.current.preference).toBe('system');
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

  it('follows the device again when set back to auto', () => {
    localStorage.setItem('theme', 'dark');
    const hook = mountHook();
    expect(hook.current.resolved).toBe('dark');

    hook.choose('system');

    expect(localStorage.getItem('theme')).toBeNull();
    expect(hook.current.resolved).toBe('light');
    hook.unmount();
  });

  it('tracks the device changing while on auto', () => {
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

    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#10161d');
    hook.unmount();
  });
});
