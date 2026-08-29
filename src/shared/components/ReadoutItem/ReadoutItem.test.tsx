// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ReadoutItem } from './ReadoutItem';
import { ModuleShellProvider } from '@/shared/context/moduleShell';

afterEach(cleanup);

function renderIn(blinded: boolean, node: React.ReactNode) {
  return render(<ModuleShellProvider blinded={blinded}>{node}</ModuleShellProvider>);
}

describe('ReadoutItem', () => {
  it('shows its value normally', () => {
    renderIn(false, <ReadoutItem label="MAP" value="93" unit="mmHg" />);

    expect(screen.getByText('93')).toBeTruthy();
    expect(screen.getByText('mmHg')).toBeTruthy();
  });

  /**
   * The exercise answers itself otherwise. shockStates asked "which of these fits what you are
   * seeing?" over four options — one of them "Haemorrhagic" — while a tile labelled PATTERN
   * read "hypovolaemic" a few hundred pixels above.
   */
  it('withholds a pattern-naming value while a pattern question is open', () => {
    renderIn(true, <ReadoutItem label="Pattern" value="hypovolaemic" secondary="low output" revealsPattern />);

    expect(screen.queryByText('hypovolaemic')).toBeNull();
    expect(screen.queryByText('low output')).toBeNull();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('keeps the label, so the grid does not reflow when the answer is revealed', () => {
    renderIn(true, <ReadoutItem label="Pattern" value="hypovolaemic" revealsPattern />);

    expect(screen.getByText('Pattern')).toBeTruthy();
  });

  it('blinds nothing that is not a pattern name, because the numbers ARE the exercise', () => {
    renderIn(true, <ReadoutItem label="CVP" value="2" unit="mmHg" />);

    expect(screen.getByText('2')).toBeTruthy();
  });

  it('reveals the pattern again once the question is answered', () => {
    renderIn(false, <ReadoutItem label="Pattern" value="hypovolaemic" revealsPattern />);

    expect(screen.getByText('hypovolaemic')).toBeTruthy();
  });
});
