// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { HReviewPage } from './HReviewPage';

afterEach(cleanup);

describe('HReviewPage', () => {
  it('renders as a private working paper, not a linked destination', () => {
    render(<HReviewPage />);
    expect(screen.getByRole('heading', { level: 1, name: /accessibility review/i })).toBeTruthy();
    expect(screen.getByText(/not linked from anywhere in the app/i)).toBeTruthy();
  });

  it('computes every contrast figure from the shipped tokens, so none can go stale', () => {
    render(<HReviewPage />);
    const table = screen.getByRole('table', {
      name: /ratios computed live from TOKENS/i,
    });
    // A hand-typed figure rots; a computed one moves with the palette. If any row ever
    // renders Fail, a token change has broken a floor this page claims — fix the token,
    // never the page.
    expect(within(table).queryByText('Fail')).toBeNull();
  });

  it('names every failure with its state', () => {
    render(<HReviewPage />);
    const table = screen.getByRole('table', { name: /every measured failure/i });
    const rows = within(table).getAllByRole('row');
    // 1 header + 15 failures: the border plus six repaired mock defects plus eight open items.
    expect(rows).toHaveLength(16);
    expect(within(table).getByText(/still interim/i)).toBeTruthy();
  });
});
