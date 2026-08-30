// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrandMark } from './BrandMark';

afterEach(cleanup);

describe('BrandMark', () => {
  it('names the product over the group it belongs to', () => {
    render(<BrandMark />);
    expect(screen.getByText('Physiology Lab')).toBeTruthy();
    expect(screen.getByText('Bentara Medical')).toBeTruthy();
  });

  it('is inert unless given somewhere to go, so it cannot duplicate a back link', () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('links home when asked', () => {
    render(<BrandMark href="#home" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('#home');
  });
});

describe('BrandMark heading', () => {
  it('can be the page heading, so a page whose title IS the lockup keeps its h1', () => {
    render(<BrandMark as="h1" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Physiology Lab');
  });

  it('is not a heading by default, so it cannot compete with the one beside it', () => {
    render(<BrandMark />);
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
