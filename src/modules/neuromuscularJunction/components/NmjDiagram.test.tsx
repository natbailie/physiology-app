// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { NmjDiagram } from './NmjDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_NMJ_INPUTS, NMJ_PRESETS } from '../engine/presets';
import type { NmjInputs } from '../engine/types';

afterEach(cleanup);

/**
 * Four lesions, four structures, four visibly different pictures. Before the redraw every one
 * of these produced the same drawing and only the numbers moved, which is exactly the failure
 * these assertions exist to prevent recurring.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<NmjInputs>, seconds = 20) {
  const inputs = { ...DEFAULT_NMJ_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<NmjInputs>) {
  const { container } = render(<NmjDiagram derived={settled(preset)} />);
  return {
    container,
    dockedVesicles: container.querySelectorAll('[class*="vesicleDocked"]').length,
    receptors: container.querySelectorAll('[class*="receptor"]').length,
    calcium: Number((container.querySelector('[class*="calciumChannel"]') as SVGElement).style.getPropertyValue('--calcium')),
    esterase: Number((container.querySelector('[class*="esterase"]') as SVGElement).style.getPropertyValue('--esterase')),
  };
}

describe('neuromuscular junction diagram', () => {
  const baseline = () => draw(NMJ_PRESETS.normal);

  it('draws a full complement of every structure at baseline', () => {
    const n = baseline();

    expect(n.dockedVesicles).toBeGreaterThan(0);
    expect(n.receptors).toBeGreaterThan(0);
    expect(n.calcium).toBeGreaterThan(0.9);
    expect(n.esterase).toBeGreaterThan(0.9);
  });

  /** Botulinum toxin cleaves the SNAREs, so nothing ever docks. Presynaptic, at the first step. */
  it('empties the docked vesicles in botulism', () => {
    const normal = baseline();
    cleanup();
    const botulism = draw(NMJ_PRESETS.botulism);

    expect(botulism.dockedVesicles).toBeLessThan(normal.dockedVesicles);
    expect(botulism.receptors).toBe(normal.receptors); // postsynaptic side untouched
  });

  /** Lambert-Eaton is an antibody against the calcium channel — the vesicles are all still there. */
  it('takes the calcium channels in Lambert-Eaton', () => {
    const normal = baseline();
    cleanup();
    const le = draw(NMJ_PRESETS.lambertEaton);

    expect(le.calcium).toBeLessThan(0.6);
    expect(le.receptors).toBe(normal.receptors);
  });

  /** Myasthenia thins the receptors on the crests and leaves the nerve releasing normally. */
  it('thins the receptors in myasthenia, sparing everything presynaptic', () => {
    const normal = baseline();
    cleanup();
    const mg = draw(NMJ_PRESETS.myastheniaGravis);

    expect(mg.receptors).toBeLessThan(normal.receptors);
    expect(mg.calcium).toBeGreaterThan(0.9);
    expect(mg.dockedVesicles).toBe(normal.dockedVesicles);
  });

  /** An organophosphate strips the enzyme out of the cleft. */
  it('removes the cholinesterase in organophosphate poisoning', () => {
    const normal = baseline();
    cleanup();
    const op = draw(NMJ_PRESETS.organophosphate);

    expect(op.esterase).toBeLessThan(normal.esterase * 0.5);
    expect(op.receptors).toBe(normal.receptors);
  });

  /** The four lesions must not all look the same, which is the whole point of the redraw. */
  it('produces a different structural signature for each presynaptic lesion', () => {
    const signature = (preset: Partial<NmjInputs>) => {
      cleanup();
      const n = draw(preset);
      return `${n.dockedVesicles}/${n.receptors}/${n.calcium.toFixed(2)}/${n.esterase.toFixed(2)}`;
    };

    const seen = new Set([
      signature(NMJ_PRESETS.normal),
      signature(NMJ_PRESETS.botulism),
      signature(NMJ_PRESETS.lambertEaton),
      signature(NMJ_PRESETS.myastheniaGravis),
      signature(NMJ_PRESETS.organophosphate),
    ]);

    expect(seen.size).toBe(5);
  });
});
