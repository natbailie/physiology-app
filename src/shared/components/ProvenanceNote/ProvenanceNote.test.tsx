// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ProvenanceNote } from './ProvenanceNote';

afterEach(cleanup);

describe('a module shows where its numbers came from', () => {
  it('names the Pulse engine on a module a trace actually corroborates', async () => {
    render(<ProvenanceNote moduleId="shockStates" />);
    await waitFor(() => expect(screen.getByText(/Pulse Physiology Engine/)).toBeTruthy());
    expect(screen.getByText('Engine-corroborated')).toBeTruthy();
  });

  it('admits the gap on a module with no independent check of its dynamics', async () => {
    render(<ProvenanceNote moduleId="liverPhysiology" />);
    await waitFor(() =>
      expect(screen.getByText(/has not been checked against an independent engine/)).toBeTruthy(),
    );
    expect(screen.queryByText(/Pulse/)).toBeNull();
  });

  it('lists the actual citation behind each band once expanded', async () => {
    render(<ProvenanceNote moduleId="venousReturn" />);
    await waitFor(() => expect(screen.getByText(/Guyton \(1955\)/)).toBeTruthy());
    // The band itself is shown beside the quantity: a citation with no interval is not checkable.
    expect(screen.getAllByText(/mmHg/).length).toBeGreaterThan(0);
  });

  it('renders nothing at all for a module with no references file', async () => {
    const { container } = render(<ProvenanceNote moduleId="notAModule" />);
    await waitFor(() => expect(container.querySelector('details')).toBeNull());
  });
});
