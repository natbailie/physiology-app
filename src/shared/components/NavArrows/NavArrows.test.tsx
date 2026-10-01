// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NavArrows } from './NavArrows';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('NavArrows', () => {
  it('links home and marks it current on the home route', () => {
    window.location.hash = '';
    render(<NavArrows />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('href')).toBe('#');
    expect(home.getAttribute('aria-current')).toBe('page');
  });

  it('does not mark home current elsewhere', () => {
    window.location.hash = '#pricing';
    render(<NavArrows />);
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });

  it('retraces history with back and forward', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const forward = vi.spyOn(window.history, 'forward').mockImplementation(() => {});
    render(<NavArrows />);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go forward' }));
    expect(back).toHaveBeenCalledOnce();
    expect(forward).toHaveBeenCalledOnce();
    back.mockRestore();
    forward.mockRestore();
  });
});
