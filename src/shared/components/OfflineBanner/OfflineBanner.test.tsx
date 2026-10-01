// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

function setOnline(value: boolean) {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

describe('OfflineBanner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('appears offline with a Retry button and hides when back online', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).toBeNull();

    setOnline(false);
    expect(screen.getByRole('status').textContent).toMatch(/offline/i);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();

    setOnline(true);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
