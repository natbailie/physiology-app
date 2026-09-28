// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ToggleGroup } from './ToggleGroup';

afterEach(cleanup);

function Harness() {
  const [value, setValue] = useState<'i' | 'ii' | 'iii'>('ii');
  return (
    <ToggleGroup
      label="Lead"
      value={value}
      onChange={setValue}
      options={[
        { value: 'i', label: 'I' },
        { value: 'ii', label: 'II' },
        { value: 'iii', label: 'III' },
      ]}
    />
  );
}

describe('ToggleGroup keyboard', () => {
  it('is one Tab stop, on the checked option', () => {
    render(<Harness />);
    const tabbable = screen.getAllByRole('radio').filter((r) => r.tabIndex === 0);
    expect(tabbable.map((r) => r.textContent)).toEqual(['II']);
  });

  it('moves and selects with the arrow keys, wrapping at the ends', () => {
    render(<Harness />);
    const ii = screen.getByRole('radio', { name: 'II' });
    ii.focus();
    fireEvent.keyDown(ii, { key: 'ArrowRight' });
    const iii = screen.getByRole('radio', { name: 'III' });
    expect(iii.getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(iii);
    fireEvent.keyDown(iii, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'I' }).getAttribute('aria-checked')).toBe('true');
  });
});
