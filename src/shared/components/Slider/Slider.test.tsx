// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Slider } from './Slider';

afterEach(cleanup);

describe('Slider', () => {
  it('announces the formatted word value, not the raw number', () => {
    render(
      <Slider label="Salt intake" value={50} min={0} max={100} formatValue={() => 'Normal'} onChange={() => {}} />,
    );
    expect(screen.getByRole('slider', { name: 'Salt intake' }).getAttribute('aria-valuetext')).toBe('Normal');
  });

  it('announces the visible badge text including the unit', () => {
    render(
      <Slider label="Contractility" value={0.55} min={0} max={2} step={0.02} unit="%" formatValue={(v) => Math.round(v * 100).toString()} onChange={() => {}} />,
    );
    expect(screen.getByRole('slider', { name: 'Contractility' }).getAttribute('aria-valuetext')).toBe('55%');
  });
});
