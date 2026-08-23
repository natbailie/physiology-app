// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RelatedModules } from './RelatedModules';
import { MODULES } from '@/home/moduleRegistry';

afterEach(cleanup);

describe('related module links', () => {
  it('only points at modules that exist', () => {
    // A dead cross-link is invisible until someone clicks it and lands on the home page.
    const ids = new Set(MODULES.map((module) => module.id));
    const broken = MODULES.flatMap((module) =>
      (module.related ?? []).filter((link) => !ids.has(link.id)).map((link) => `${module.id} -> ${link.id}`),
    );
    expect(broken.join(', ')).toBe('');
  });

  it('never links a module to itself', () => {
    const selfLinks = MODULES.filter((module) => (module.related ?? []).some((link) => link.id === module.id));
    expect(selfLinks.map((m) => m.id).join(', ')).toBe('');
  });

  it('gives every link a reason rather than only a destination', () => {
    // "See this on the ECG" tells a learner what they get; the module name only says where
    // they land, which is not enough to decide whether to follow it.
    const thin = MODULES.flatMap((module) =>
      (module.related ?? []).filter((link) => link.why.length < 15).map((link) => `${module.id} -> ${link.id}`),
    );
    expect(thin.join(', ')).toBe('');
  });

  it('does not repeat a destination within one module', () => {
    for (const module of MODULES) {
      const ids = (module.related ?? []).map((link) => link.id);
      expect(new Set(ids).size, `${module.id}`).toBe(ids.length);
    }
  });

  it('renders each link with its reason', () => {
    render(<RelatedModules moduleId="electrolyteBalance" />);
    expect(screen.getByText(/see hyperkalaemia on the ECG/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: 'ECG & Cardiac Conduction' });
    expect(link.getAttribute('href')).toBe('#ecgConduction');
  });

  it('renders nothing for a module with no relations declared', () => {
    const { container } = render(<RelatedModules moduleId="reference" />);
    expect(container.firstChild).toBeNull();
  });
});
