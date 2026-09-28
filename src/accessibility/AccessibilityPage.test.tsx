// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AccessibilityPage } from './AccessibilityPage';
import { BUSINESS } from '@/shared/legal/business';

afterEach(cleanup);

describe('AccessibilityPage', () => {
  it('states its interim compliance position honestly', () => {
    render(<AccessibilityPage />);
    expect(screen.getByRole('heading', { level: 1, name: /accessibility statement/i })).toBeTruthy();
    expect(screen.getAllByText(/partially compliant/i).length).toBeGreaterThan(0);
    // An interim page must not read as the report of an audit that has not run.
    expect(screen.getAllByText(/interim/i).length).toBeGreaterThan(0);
  });

  it('commits to no calendar date, and routes feedback to the trader contact', () => {
    const { container } = render(<AccessibilityPage />);
    const text = container.textContent ?? '';
    // Timings are tied to the external audit event, never to a date.
    expect(text).toMatch(/before the first institutional sale/);
    // The contact is the business mailbox from shared/legal/business.ts — one address, not a
    // second one invented here — with a response commitment.
    expect(text).toContain(BUSINESS.contactEmail);
    expect(text).toMatch(/within 5 working days/);
  });

  it('names the enforcement route', () => {
    render(<AccessibilityPage />);
    expect(screen.getByText(/Equality and Human Rights Commission/i)).toBeTruthy();
  });

  it('scopes itself to the website and the phone app, and routes complaints via the advisory service', () => {
    render(<AccessibilityPage />);
    expect(screen.getByRole('heading', { name: 'Scope' })).toBeTruthy();
    expect(screen.getByText(/applies to the Physiology Lab website and the Physiology phone app/i)).toBeTruthy();
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
    expect(text).toMatch(/last tested\s+on 28 September 2026/i);
    expect(text).toMatch(/no disproportionate burden is claimed/i);
  });
});
