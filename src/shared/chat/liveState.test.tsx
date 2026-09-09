// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { ReadoutGridView } from '@/shared/presentation/web/ReadoutGridView';
import type { ReadoutSpec } from '@/shared/presentation/types';
import { readLiveState } from './liveState';
import { renderLiveState } from './systemPrompt';

afterEach(cleanup);

/**
 * What the tutor can see of the learner's screen.
 *
 * The TILE is the publisher, so these render real components: a test that called
 * `publishLiveState` directly would prove the store works and nothing about whether the numbers
 * on screen are the numbers sent.
 *
 * Both shapes of readout panel are covered on purpose. Nine web pages render the schema grid and
 * thirty-eight still render a hand-written panel, and a tutor that could see one and not the
 * other would be a feature a learner cannot predict.
 */

interface State {
  map: number;
}
type Derived = Record<string, never>;
type Inputs = Record<string, never>;

const SPECS: ReadoutSpec<State, Derived, Inputs>[] = [
  { label: 'MAP', value: (ctx) => String(ctx.state.map), unit: 'mmHg' },
  { label: 'Filling', value: () => 'low', secondary: () => 'venous return falling' },
  { label: 'Pattern', value: () => 'hypovolaemic', revealsPattern: true },
];

function renderGrid(blinded: boolean, map = 93) {
  return render(
    <ModuleShellProvider blinded={blinded} moduleId="cardiorenal">
      <ReadoutGridView readouts={SPECS} ctx={{ state: { map }, derived: {}, inputs: {} }} />
    </ModuleShellProvider>,
  );
}

describe('live state published to the tutor', () => {
  it('offers the tiles on screen, with the module that owns them', () => {
    renderGrid(false);

    const live = readLiveState();
    expect(live?.moduleId).toBe('cardiorenal');
    expect(live?.readings.map((reading) => reading.label)).toEqual(['MAP', 'Filling', 'Pattern']);
    expect(live?.readings[0]).toMatchObject({ label: 'MAP', value: '93', unit: 'mmHg' });
    expect(live?.readings[1]?.secondary).toBe('venous return falling');
  });

  /**
   * The failure this exists to prevent: a tile that names the pattern goes blank on screen while
   * a pattern question is unanswered, and if it were still published the learner could ask the
   * tutor anything at all and be handed the answer to the question they are sitting in.
   */
  it('withholds a pattern-naming tile while a pattern question is open', () => {
    renderGrid(true);

    const labels = readLiveState()?.readings.map((reading) => reading.label);
    expect(labels).toEqual(['MAP', 'Filling']);
    expect(JSON.stringify(readLiveState())).not.toContain('hypovolaemic');
  });

  /** Read at send time, so a value that moved after the last render still goes out current. */
  it('reads the latest values rather than the ones from the first render', () => {
    const { rerender } = renderGrid(false, 93);

    rerender(
      <ModuleShellProvider blinded={false} moduleId="cardiorenal">
        <ReadoutGridView readouts={SPECS} ctx={{ state: { map: 41 }, derived: {}, inputs: {} }} />
      </ModuleShellProvider>,
    );

    expect(readLiveState()?.readings[0]?.value).toBe('41');
  });

  /** Leaving a module leaves the tutor with no screen, rather than a stale one. */
  it('withdraws the screen on unmount', () => {
    renderGrid(false).unmount();

    expect(readLiveState()).toBeNull();
  });
});

describe('renderLiveState', () => {
  it('writes one line per tile, with the unit and the note', () => {
    expect(
      renderLiveState([
        { label: 'MAP', value: '93', unit: 'mmHg' },
        { label: 'Filling', value: 'low', secondary: 'venous return falling' },
        { label: 'Phase', value: 'compensating' },
      ]),
    ).toBe('- MAP: 93 mmHg\n- Filling: low (venous return falling)\n- Phase: compensating');
  });

  /** A learner asking from the home page should not be sent a heading with nothing under it. */
  it('is absent rather than empty when no module is open', () => {
    expect(renderLiveState([])).toBeUndefined();
  });
});

describe('a hand-written readout panel', () => {
  /**
   * The reason the tile registers itself rather than the grid publishing.
   *
   * Most module pages have not been converted to the presentation schema yet — they build their
   * tiles by hand. They still reach the tutor, because they still build them out of `ReadoutItem`.
   */
  it('reaches the tutor too, without going through the schema grid', () => {
    render(
      <ModuleShellProvider blinded={false} moduleId="venousReturn">
        <div>
          <ReadoutItem label="Cardiac output" value="5.1" unit="L/min" />
          <ReadoutItem label="Right atrial pressure" value="0.4" unit="mmHg" />
        </div>
      </ModuleShellProvider>,
    );

    const live = readLiveState();
    expect(live?.moduleId).toBe('venousReturn');
    expect(live?.readings).toEqual([
      { label: 'Cardiac output', value: '5.1', unit: 'L/min' },
      { label: 'Right atrial pressure', value: '0.4', unit: 'mmHg' },
    ]);
  });

  it('withholds a pattern-naming tile there as well', () => {
    render(
      <ModuleShellProvider blinded moduleId="shockStates">
        <div>
          <ReadoutItem label="MAP" value="52" unit="mmHg" />
          <ReadoutItem label="Pattern" value="hypovolaemic" revealsPattern />
        </div>
      </ModuleShellProvider>,
    );

    expect(readLiveState()?.readings.map((reading) => reading.label)).toEqual(['MAP']);
  });
});
