// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { VisionDiagram } from './VisionDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_VISION_INPUTS } from '../engine/presets';
import type { VisionInputs } from '../engine/types';

afterEach(cleanup);

/**
 * The module's claim is that the SITE draws the pattern. These assertions check the drawing
 * makes that claim visible: the lesion is marked where it sits, and the field charts show the
 * defect that site produces.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<VisionInputs>, seconds = 20) {
  const inputs = { ...DEFAULT_VISION_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<VisionInputs>) {
  const derived = settled(preset);
  const { container } = render(<VisionDiagram derived={derived} />);
  return { container, derived };
}

/** Quadrants are drawn in order per eye: superior-temporal, inferior-temporal, superior-nasal,
 * inferior-nasal, right eye first. A "lost" quadrant carries the fieldQuadLost class. */
function lostQuadrants(container: HTMLElement) {
  return [...container.querySelectorAll('[class*="fieldQuad"]')].map((e) =>
    (e.getAttribute('class') || '').includes('fieldQuadLost'),
  );
}

describe('visual pathway diagram', () => {
  it('marks no lesion and loses no field when the pathway is intact', () => {
    const { container } = draw({ fieldLesionSite: 'none' });

    expect(container.querySelector('[class*="lesionMark"]')).toBeNull();
    expect(lostQuadrants(container).some(Boolean)).toBe(false);
  });

  /** The classic: pressure in the middle of the chiasm takes the crossing nasal fibres from
   * both eyes, which are the fibres carrying each eye's TEMPORAL field. */
  it('takes both temporal fields from a chiasmal lesion', () => {
    const { container, derived } = draw({ fieldLesionSite: 'chiasmalCentre' });

    expect(derived.fieldDefectLabel).toContain('bitemporal');
    expect(container.querySelector('[class*="lesionMark"]')).not.toBeNull();
    expect(container.textContent).toContain('chiasm');

    const [rST, rIT, rSN, rIN, lST, lIT, lSN, lIN] = lostQuadrants(container);
    expect(rST && rIT).toBe(true); // right eye temporal gone
    expect(lST && lIT).toBe(true); // left eye temporal gone
    expect(rSN || rIN || lSN || lIN).toBe(false); // nasal fields spared in both
  });

  /** One nerve, one eye. The defining difference from everything past the chiasm. */
  it('blinds a single eye from an optic nerve lesion', () => {
    const { container } = draw({ fieldLesionSite: 'leftOpticNerve' });
    const q = lostQuadrants(container);

    expect(q.slice(0, 4).some(Boolean)).toBe(false); // right eye untouched
    expect(q.slice(4).every(Boolean)).toBe(true); // left eye entirely gone
  });

  /** Past the chiasm the defect is homonymous — the same side of space in both eyes. */
  it('takes the same side of both eyes from a lesion behind the chiasm', () => {
    const { container, derived } = draw({ fieldLesionSite: 'rightOccipitalLobe' });

    expect(derived.fieldDefectLabel).toContain('homonymous');
    const q = lostQuadrants(container);
    expect(q.slice(0, 4).some(Boolean)).toBe(true);
    expect(q.slice(4).some(Boolean)).toBe(true);
  });

  it("puts Meyer's loop lesion at a different place on the drawing from the occipital one", () => {
    const markAt = (site: VisionInputs['fieldLesionSite']) => {
      cleanup();
      const { container } = render(<VisionDiagram derived={settled({ fieldLesionSite: site })} />);
      const line = container.querySelector('[class*="lesionMark"] line') as SVGElement;
      return `${line.getAttribute('x1')},${line.getAttribute('y1')}`;
    };

    expect(markAt('leftTemporalRadiation')).not.toBe(markAt('leftOccipitalLobe'));
  });

  it('draws each pupil at its own diameter', () => {
    const { container, derived } = draw({ rightPupilEfferentGain: 0.05 });
    const pupils = [...container.querySelectorAll('[class*="pupil"]')].map((e) => Number(e.getAttribute('r')));

    expect(derived.anisocoriaMm).toBeGreaterThan(1);
    expect(pupils[0]).not.toBe(pupils[1]);
  });
});
