// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MotorDiagram } from './MotorDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_MOTOR_INPUTS, MOTOR_PRESETS } from '../engine/presets';
import type { MotorInputs } from '../engine/types';

afterEach(cleanup);

/**
 * Every preset in this module names a node in the circuit, so every preset must dim a node in
 * the drawing. These assertions are what keep the loop from collapsing back into four boxes on
 * a line with no globus pallidus in them.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<MotorInputs>, seconds = 40) {
  const inputs = { ...DEFAULT_MOTOR_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

/** Integrity of each lesionable node, keyed by the element that draws it. */
function nodes(container: HTMLElement) {
  const integ = (sel: string, i = 0) =>
    Number(([...container.querySelectorAll(sel)][i] as SVGElement).style.getPropertyValue('--integrity'));
  return {
    striatum: integ('rect[class*="nodeLesioned"]'),
    nigra: integ('[class*="nigra"]'),
    stn: integ('circle[class*="nodeLesioned"]'),
    cerebellum: integ('ellipse[class*="nodeLesioned"]'),
    movement: integ('[class*="outputNode"]'),
  };
}

function draw(preset: Partial<MotorInputs>) {
  const { container } = render(<MotorDiagram derived={settled(preset)} />);
  return nodes(container);
}

describe('basal ganglia diagram', () => {
  it('draws every node intact at baseline', () => {
    const n = draw(MOTOR_PRESETS.normal);

    expect(n.nigra).toBeGreaterThan(0.9);
    expect(n.stn).toBeGreaterThan(0.9);
    expect(n.striatum).toBeGreaterThan(0.9);
    expect(n.cerebellum).toBeGreaterThan(0.9);
  });

  it('empties the substantia nigra in Parkinson’s, and nothing else', () => {
    const n = draw(MOTOR_PRESETS.advancedParkinson);

    expect(n.nigra).toBeLessThan(0.3);
    expect(n.stn).toBeGreaterThan(0.9);
    expect(n.cerebellum).toBeGreaterThan(0.9);
    // The consequence: the loop stops releasing the thalamus, so movement shrinks.
    expect(n.movement).toBeLessThan(0.4);
  });

  /** Hemiballismus is a subthalamic lesion — the one node the old drawing did have, and the
   * only preset whose name is an anatomical address. */
  it('lesions the subthalamic nucleus in hemiballismus, sparing the nigra', () => {
    const n = draw(MOTOR_PRESETS.hemiballismus);

    expect(n.stn).toBeLessThan(0.4);
    expect(n.nigra).toBeGreaterThan(0.9);
  });

  it('takes the striatum in Huntington-type chorea', () => {
    const n = draw(MOTOR_PRESETS.huntingtonChorea);

    expect(n.striatum).toBeLessThan(0.6);
    expect(n.nigra).toBeGreaterThan(0.9);
  });

  /** Two presets lesion structures outside the loop, which is why they are drawn at all. */
  it('lesions the cerebellum in ataxia and leaves the loop alone', () => {
    const n = draw(MOTOR_PRESETS.cerebellarAtaxia);

    expect(n.cerebellum).toBeLessThan(0.5);
    expect(n.nigra).toBeGreaterThan(0.9);
    expect(n.stn).toBeGreaterThan(0.9);
  });

  it('thins the corticospinal tract in UMN hemiparesis', () => {
    const strengthOf = (preset: Partial<MotorInputs>) => {
      cleanup();
      const { container } = render(<MotorDiagram derived={settled(preset)} />);
      return Number((container.querySelector('[class*="corticospinal"]') as SVGElement).style.getPropertyValue('--strength'));
    };

    expect(strengthOf(MOTOR_PRESETS.strokeUmnHemiparesis)).toBeLessThan(strengthOf(MOTOR_PRESETS.normal));
  });
});
