// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadQuestionIndex } from './moduleQuestionIds';
import { ThemePage } from './ThemePage';

afterEach(cleanup);

beforeAll(async () => {
  // Rendering the page kicks off the lazy question-index build (see useModuleProgress). Resolve
  // it inside the environment, or its heavyweight lazy imports land after jsdom tears down and
  // the full parallel suite reports them as an unhandled error against this file.
  await loadQuestionIndex();
});

describe('ThemePage', () => {
  it('shows the theme title and links back to the topic grid', () => {
    render(<ThemePage themeId="cardiovascular" />);
    expect(screen.getByRole('heading', { name: 'Cardiovascular' })).toBeTruthy();
    const back = screen.getByRole('link', { name: /All topics/i });
    expect(back.getAttribute('href')).toBe('#home');
  });

  it('renders the module cards the registry assigns to the theme', () => {
    render(<ThemePage themeId="cellMolecular" />);
    expect(screen.getByRole('link', { name: /Enzyme Kinetics/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Cell Cycle/ })).toBeTruthy();
  });

  it('stays within its own theme — no cards from elsewhere', () => {
    render(<ThemePage themeId="cellMolecular" />);
    expect(screen.queryByRole('link', { name: /Shock States/ })).toBeNull();
  });
});