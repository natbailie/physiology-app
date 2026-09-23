// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AccessibilityPage } from './AccessibilityPage';

afterEach(cleanup);

describe('AccessibilityPage', () => {
  it('states its interim compliance position honestly', () => {
    render(<AccessibilityPage />);
    expect(screen.getByRole('heading', { level: 1, name: /accessibility statement/i })).toBeTruthy();
    expect(screen.getAllByText(/partially compliant/i).length).toBeGreaterThan(0);
    // An interim page must not read as the report of an audit that has not run.
    expect(screen.getAllByText(/interim/i).length).toBeGreaterThan(0);
  });

  it('commits to no calendar date and invents no contact channel', () => {
    const { container } = render(<AccessibilityPage />);
    const text = container.textContent ?? '';
    // Timings are tied to the external audit event; support contacts do not exist yet.
    expect(text).toMatch(/before the first institutional sale/);
    expect(text).not.toMatch(/mailto:/);
  });

  it('names the enforcement route', () => {
    render(<AccessibilityPage />);
    expect(screen.getByText(/Equality and Human Rights Commission/i)).toBeTruthy();
  });

  it('scopes itself to the website and routes complaints via the advisory service', () => {
    render(<AccessibilityPage />);
    expect(screen.getByRole('heading', { name: 'Scope' })).toBeTruthy();
    // Pinned as the full sentence: asserting only the first half is what let a
    // redundant trailing clause ship uncaught.
    expect(
      screen.getByText(/does not cover the\s+separate native mobile apps/i).closest('p')?.textContent,
    ).toBe('This statement applies to the Physiology Lab website. It does not cover the separate native mobile apps.');
    expect(screen.getByText(/Equality Advisory\s+and Support Service/i)).toBeTruthy();
  });

  it('lists the assistive-technology surfaces already in place', () => {
    render(<AccessibilityPage />);
    expect(screen.getByText(/announces its answers to screen readers as they stream/i)).toBeTruthy();
    expect(screen.getByText(/works with a password manager and sets no puzzle/i)).toBeTruthy();
  });

  it('states when it was last tested and claims no exemptions', () => {
    const { container } = render(<AccessibilityPage />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/last tested\s+on 14 September 2026/i);
    expect(text).toMatch(/no disproportionate burden is claimed/i);
  });
});
