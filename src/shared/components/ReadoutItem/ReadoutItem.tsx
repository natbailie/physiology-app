import { memo } from 'react';
import type { CSSProperties } from 'react';
import { Term } from '@/shared/components/Term/Term';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './ReadoutItem.module.css';

interface ReadoutItemProps {
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  /**
   * The slider position this reading answers to, shown as `slider: 110` whenever the two differ.
   *
   * Several controls set a quantity the body then modifies, so the number under the slider and
   * the number in the tile are genuinely different readings of the same thing: an intrinsic rate
   * of 110 arrives as a heart rate of 106 once sympathetic and vagal drive are applied. Without
   * this the pair reads as a bug; with it, the gap IS the teaching.
   */
  setPoint?: number;
  colorVar?: string;
  /** Span the full width of the readout grid. For a value that is a verdict rather than a
   * number — it needs the room, and an odd tile count otherwise leaves an empty cell. */
  wide?: boolean;
  /**
   * This tile names the pattern the model has settled into, so it must go blank while a
   * pattern-discrimination question is open.
   *
   * Without it the exercise answers itself: shockStates asked "which of these fits what you
   * are seeing?" above four options while a tile labelled PATTERN read "hypovolaemic".
   */
  revealsPattern?: boolean;
}

/** Formats the set point to the same precision the tile is showing, so a disclosure only
 * appears when the two differ at the precision a reader can actually see. */
function setPointHint(value: string, setPoint: number | undefined): string | undefined {
  if (setPoint === undefined) return undefined;
  const decimals = value.split('.')[1]?.replace(/\D.*$/, '').length ?? 0;
  const formatted = setPoint.toFixed(decimals);
  return formatted === value.replace(/[^\d.-]/g, '') ? undefined : `slider: ${formatted}`;
}

function ReadoutItemBase({
  label,
  value,
  unit,
  secondary,
  setPoint,
  colorVar,
  wide,
  revealsPattern,
}: ReadoutItemProps) {
  const { blinded } = useModuleShell();
  // Both, when both apply: the note a module wrote and the slider it drifted from.
  const hint = [secondary, setPointHint(value, setPoint)].filter(Boolean).join(' · ');
  const style = colorVar ? ({ '--tile-color': colorVar } as CSSProperties) : undefined;
  const withheld = Boolean(revealsPattern && blinded);

  return (
    <div className={wide ? `${styles.tile} ${styles.wide}` : styles.tile}>
      {/* Looks its own label up, so a module gains definitions without being touched. */}
      <span className={`label ${styles.label}`} style={style}>
        <Term label={label} />
      </span>
      <div className={styles.valueRow}>
        <span className={`numeral ${styles.value}`}>{withheld ? '—' : value}</span>
        {unit && !withheld && <span className={styles.unit}>{unit}</span>}
      </div>
      {withheld ? (
        <span className={styles.secondary}>you are naming this one</span>
      ) : (
        hint !== '' && <span className={`numeral ${styles.secondary}`}>{hint}</span>
      )}
    </div>
  );
}

export const ReadoutItem = memo(ReadoutItemBase);
