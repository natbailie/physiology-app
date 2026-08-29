// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Term } from './Term';
import { GLOSSARY, lookupTerm } from '@/shared/glossary/terms';

afterEach(cleanup);

describe('Term', () => {
  it('renders a defined label as something a keyboard can reach', () => {
    // A title attribute would fail here, which is the whole reason this component exists.
    render(<Term label="MAP" />);
    expect(screen.getByRole('button', { name: 'MAP' })).toBeTruthy();
  });

  it('associates the definition with the trigger for a screen reader', () => {
    render(<Term label="MAP" />);
    const trigger = screen.getByRole('button', { name: 'MAP' });
    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain('arterial pressure');
  });

  it('falls through to plain text for a label the glossary does not define', () => {
    // Every readout in the app renders through this, so an undefined label must cost nothing.
    render(<Term label="Some unlabelled quantity" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Some unlabelled quantity')).toBeTruthy();
  });

  it('places the bubble without help from layout', () => {
    // jsdom reports every rect as zero, so this cannot assert a position — what it does assert
    // is that the measuring runs on a page with no layout at all rather than throwing and
    // taking the whole readout panel down with it.
    render(<Term label="MAP" />);
    const trigger = screen.getByRole('button', { name: 'MAP' });
    const bubble = document.getElementById(trigger.getAttribute('aria-describedby')!)!;

    fireEvent.pointerEnter(trigger);
    expect(bubble.style.top).toBeTruthy();
    fireEvent.focus(trigger);
    expect(bubble.style.left).toBeTruthy();
  });

  it('matches a label regardless of case or spacing', () => {
    expect(lookupTerm('SaO2')).toBeTruthy();
    expect(lookupTerm('  sao2  ')).toBeTruthy();
    expect(lookupTerm('Mean Arterial Pressure')).toBeTruthy();
  });
});

describe('the glossary itself', () => {
  it('says what an abnormal value would mean, not just what the acronym stands for', () => {
    // A definition that only expands the initials has told a learner nothing they could not
    // have guessed from context.
    const thin = Object.entries(GLOSSARY)
      .filter(([, entry]) => entry.definition.length < 80)
      .map(([key]) => key);
    expect(thin.join(', ')).toBe('');
  });

  it('is keyed in the normalised form it looks up by', () => {
    const badKeys = Object.keys(GLOSSARY).filter((key) => key !== key.trim().toLowerCase());
    expect(badKeys.join(', ')).toBe('');
  });
});
