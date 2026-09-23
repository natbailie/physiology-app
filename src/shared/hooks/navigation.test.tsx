// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';
import { useLinkPrefetch } from './useLinkPrefetch';

/**
 * The two halves of "clicking something feels smooth", both of which fail silently if they regress.
 *
 * A view transition that is started before the incoming chunk has landed cross-fades into the blank
 * Suspense fallback, which looks like a flash rather than a bug. A reduced-motion guard that stops
 * working is invisible to anyone not using the setting. And a prefetch that stops matching links
 * just puts the blank screen back, which is exactly the state this replaced.
 */

/** Stands in for the lazy page table: one entry per route, each with the `preload` both the router
 *  and the prefetch hook call, held open so a test can decide when the chunk lands. */
const PAGES: Record<string, { preload: ReturnType<typeof vi.fn> }> = {};
let resolveChunk: (() => void) | undefined;

vi.mock('@/pages', () => ({
  get PAGES() {
    return PAGES;
  },
}));

function Probe() {
  useLinkPrefetch();
  const route = useHashRoute();
  return (
    <div>
      <span data-testid="route">{route}</span>
      <a href="#respiratory">Respiratory</a>
    </div>
  );
}

let reduced = false;
let startViewTransition: ((cb: () => void) => { finished: Promise<void> }) | undefined;

beforeEach(() => {
  reduced = false;
  window.location.hash = '';
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  startViewTransition = vi.fn((cb: () => void) => {
    cb();
    return { finished: Promise.resolve() };
  });
  Object.defineProperty(document, 'startViewTransition', { value: startViewTransition, configurable: true, writable: true });
  for (const id of ['respiratory', 'cardiorenal']) {
    PAGES[id] = { preload: vi.fn(() => new Promise<void>((resolve) => { resolveChunk = resolve; })) };
  }
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function go(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('useHashRoute', () => {
  it('waits for the incoming page chunk before starting the transition', async () => {
    render(<Probe />);
    go('#cardiorenal');
    // The chunk has not resolved, so nothing has committed and nothing has been captured.
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="route"]')!.textContent).toBe('home');

    resolveChunk?.();
    await waitFor(() => expect(startViewTransition).toHaveBeenCalled());
    expect(document.querySelector('[data-testid="route"]')!.textContent).toBe('cardiorenal');
  });

  it('scrolls back to the top, inside the transition rather than after it', async () => {
    render(<Probe />);
    go('#cardiorenal');
    resolveChunk?.();
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' }));
  });

  it('gives up waiting rather than leaving the old page under the new URL', async () => {
    vi.useFakeTimers();
    try {
      render(<Probe />);
      go('#cardiorenal');
      // The chunk never lands. Waiting on it forever would show the previous page with the new
      // address in the bar, which reads as a frozen app rather than as a slow network.
      await vi.advanceTimersByTimeAsync(300);
      expect(startViewTransition).toHaveBeenCalled();
      expect(document.querySelector('[data-testid="route"]')!.textContent).toBe('cardiorenal');
    } finally {
      vi.useRealTimers();
    }
  });

  it('navigates instantly, with no transition, under reduced motion', () => {
    reduced = true;
    render(<Probe />);
    go('#cardiorenal');
    // Synchronous: no await, no resolved chunk. Reduced motion means instant, not merely fast.
    expect(document.querySelector('[data-testid="route"]')!.textContent).toBe('cardiorenal');
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it('navigates when the browser has no view transitions at all', () => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true, writable: true });
    render(<Probe />);
    go('#cardiorenal');
    expect(document.querySelector('[data-testid="route"]')!.textContent).toBe('cardiorenal');
  });
});

describe('useLinkPrefetch', () => {
  it('warms a page chunk when the pointer reaches its link', () => {
    render(<Probe />);
    document.querySelector('a')!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(PAGES.respiratory!.preload).toHaveBeenCalled();
  });

  it('ignores a link that names no page', () => {
    const { container } = render(<Probe />);
    const bare = document.createElement('a');
    bare.setAttribute('href', '#');
    container.append(bare);
    expect(() => bare.dispatchEvent(new Event('pointerover', { bubbles: true }))).not.toThrow();
  });
});
