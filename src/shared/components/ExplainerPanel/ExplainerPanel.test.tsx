// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ExplainerPanel, type ExplainerContent } from './ExplainerPanel';

afterEach(cleanup);

const CONTENT: ExplainerContent = {
  title: 'How the mechanism actually works',
  paragraphs: ['The first paragraph explains the mechanism.', 'The second adds the clinical payoff.'],
};

describe('ExplainerPanel', () => {
  it('opens by default, so a module does not present as unexplained sliders', () => {
    const { container } = render(<ExplainerPanel content={CONTENT} />);
    expect(container.querySelector('details')?.open).toBe(true);
    expect(screen.getByText(CONTENT.paragraphs[0]!)).toBeTruthy();
  });

  it('collapses when asked', () => {
    // Practice sessions collapse it: several explainers state outright what a predict-then-run
    // question is asking the learner to work out.
    const { container } = render(<ExplainerPanel content={CONTENT} startCollapsed />);
    expect(container.querySelector('details')?.open).toBe(false);
  });

  it('renders every paragraph and the title', () => {
    render(<ExplainerPanel content={CONTENT} />);
    expect(screen.getByText(CONTENT.title)).toBeTruthy();
    for (const paragraph of CONTENT.paragraphs) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
  });
});
