import { useMemo } from 'react';
import { sampleBeat } from '../engine/beatSample';
import styles from './Diagram.module.css';
import type { EcgInputs, LeadName } from '../engine/types';

interface TwelveLeadGridProps {
  inputs: EcgInputs;
  /** Cycle length to draw one beat over, ms. */
  rrIntervalMs: number;
  selectedLead: LeadName;
  onSelectLead: (lead: LeadName) => void;
}

/** Standard twelve-lead layout: limb leads down the first two columns, chest leads across. */
const LAYOUT: LeadName[] = ['I', 'aVR', 'V1', 'V4', 'II', 'aVL', 'V2', 'V5', 'III', 'aVF', 'V3', 'V6'];

const CELL = { width: 100, height: 46 };
const MV_RANGE = 1.1;
const SAMPLES = 160;

function tracePath(samples: number[]): string {
  const mid = CELL.height / 2;
  return samples
    .map((mv, i) => {
      const x = (i / (samples.length - 1)) * CELL.width;
      const clamped = Math.max(-MV_RANGE, Math.min(MV_RANGE, mv));
      const y = mid - (clamped / MV_RANGE) * mid;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * All twelve leads at once, each showing one complete beat.
 *
 * The grid exists because the findings it carries are COMPARISONS. R-wave progression is not a
 * property of any single lead — it is what happens across six of them — and localising an
 * infarct means noticing which leads moved together and which moved the opposite way. Clicking
 * between leads one at a time cannot show either; side by side, both are obvious.
 *
 * Every trace is computed from the same activation schedule as the live strip rather than the
 * scrolling history, so the grid is a stable picture of the current morphology while the strip
 * beside it stays a moving picture of the current rhythm.
 */
export function TwelveLeadGrid({ inputs, rrIntervalMs, selectedLead, onSelectLead }: TwelveLeadGridProps) {
  const traces = useMemo(
    () => LAYOUT.map((lead) => ({ lead, d: tracePath(sampleBeat(inputs, rrIntervalMs, lead, SAMPLES)) })),
    [inputs, rrIntervalMs],
  );

  return (
    <div className={styles.gridPanel}>
      <div className={styles.gridHeader}>
        <span className="label">Twelve-lead</span>
        <span className={styles.gridNote}>one conducted beat · click a lead to record it</span>
      </div>
      <div className={styles.gridLeads}>
        {traces.map(({ lead, d }) => (
          <button
            key={lead}
            type="button"
            className={lead === selectedLead ? styles.gridCellSelected : styles.gridCell}
            aria-pressed={lead === selectedLead}
            aria-label={`Lead ${lead}`}
            onClick={() => onSelectLead(lead)}
          >
            <span className={styles.gridCellLabel}>{lead}</span>
            <svg viewBox={`0 0 ${CELL.width} ${CELL.height}`} preserveAspectRatio="none" style={{ width: '100%', height: CELL.height }}>
              <line className={styles.gridBaseline} x1={0} y1={CELL.height / 2} x2={CELL.width} y2={CELL.height / 2} />
              <path className={styles.gridTrace} d={d} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
