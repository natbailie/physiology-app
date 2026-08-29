import { memo } from 'react';
import type { SimBaseline, SimTransport } from '@/shared/hooks/useEngineLoop';
import { SPEED_OPTIONS } from '@/shared/hooks/useEngineLoop';
import styles from './SimControls.module.css';

interface SimControlsProps {
  transport: SimTransport;
  /** Omit to hide the baseline control on modules where a frozen trace is meaningless. */
  baseline?: SimBaseline<unknown>;
}

function formatSpeed(multiplier: number): string {
  return `${multiplier}x`;
}

/** Transport for simulated time, plus baseline capture.
 *
 * Pausing is what makes the readouts readable at all — several modules move faster than
 * a number can be read — and the frozen baseline is what turns two presets into a
 * comparison instead of a memory test. */
function SimControlsBase({ transport, baseline }: SimControlsProps) {
  const { playing, speed, toggle, stepOnce, setSpeed } = transport;
  const hasBaseline = baseline?.history != null;

  return (
    <div className={styles.bar} role="group" aria-label="Simulation controls">
      <button
        type="button"
        className={styles.play}
        onClick={toggle}
        aria-label={playing ? 'Pause simulation' : 'Play simulation'}
      >
        <span className={styles.glyph} aria-hidden="true">
          {playing ? '❚❚' : '▶'}
        </span>
        <span className={styles.playLabel}>{playing ? 'Pause' : 'Play'}</span>
      </button>

      <button
        type="button"
        className={styles.step}
        onClick={stepOnce}
        disabled={playing}
        title={playing ? 'Pause first to step through time' : 'Advance a short slice of time'}
      >
        Step
      </button>

      <div className={styles.speeds} role="group" aria-label="Simulation speed">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.speed}
            aria-pressed={speed === option}
            onClick={() => setSpeed(option)}
          >
            {formatSpeed(option)}
          </button>
        ))}
      </div>

      {baseline && (
        <button
          type="button"
          className={hasBaseline ? styles.baselineOn : styles.baseline}
          onClick={hasBaseline ? baseline.clear : baseline.capture}
          title={
            hasBaseline
              ? 'Remove the frozen comparison trace'
              : 'Freeze the current traces, then change a setting to see what moved'
          }
        >
          {hasBaseline ? 'Clear baseline' : 'Freeze baseline'}
        </button>
      )}
    </div>
  );
}

export const SimControls = memo(SimControlsBase);
