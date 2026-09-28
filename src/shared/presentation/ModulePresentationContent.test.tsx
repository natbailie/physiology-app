// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import { usePresentationSlots } from './ModulePresentationContent';
import type { ModulePresentation, PresentationContext } from './types';

afterEach(cleanup);

type Inputs = { level: number };
type Ctx = PresentationContext<object, object, Inputs, never>;

/** A presentation whose one frame names the lens it was built with, in its aria-label. */
function build(ctx: Ctx): ModulePresentation<object, object, Inputs, never> {
  const lens = ctx.lens ?? 'red';
  return {
    diagram: [{ type: 'frame', viewBox: [0, 0, 10, 10], ariaLabel: `drawn for ${lens}`, children: [] }],
    controls: [],
    readouts: [],
    charts: [],
    lens: {
      label: 'Highlight',
      initial: 'red',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue', colorToken: 'o2' },
      ],
    },
  };
}

function Page({ withLens }: { withLens: boolean }) {
  const [lens, setLens] = useState<string>();
  const inputs = { level: 1 };
  const ctx: Ctx = { state: {}, derived: {}, inputs, history: [], baselineHistory: null, lens };
  const slots = usePresentationSlots('test', build(ctx), ctx, inputs, () => undefined, withLens ? { value: lens, onChange: setLens } : undefined);
  return <>{slots.diagram}</>;
}

describe('a view-only lens', () => {
  it('draws a picker above the frames and re-draws them when an option is picked', () => {
    render(
      <ModuleShellProvider blinded={false}>
        <Page withLens />
      </ModuleShellProvider>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Highlight' });
    expect(screen.getByRole('radio', { name: 'Red' }).getAttribute('aria-checked')).toBe('true');
    expect(group.parentElement?.innerHTML).toContain('drawn for red');

    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(screen.getByRole('radio', { name: 'Blue' }).getAttribute('aria-checked')).toBe('true');
    expect(group.parentElement?.innerHTML).toContain('drawn for blue');
  });

  it('stays out of the way for a page that does not bind it', () => {
    render(
      <ModuleShellProvider blinded={false}>
        <Page withLens={false} />
      </ModuleShellProvider>,
    );
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });
});
