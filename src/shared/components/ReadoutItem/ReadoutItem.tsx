import { memo, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { claimTile, releaseTile, setTile } from '@/shared/chat/tileRegistry';
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
  const { blinded, moduleId } = useModuleShell();
  // Both, when both apply: the note a module wrote and the slider it drifted from.
  const hint = [secondary, setPointHint(value, setPoint)].filter(Boolean).join(' · ');
  const style = colorVar ? ({ '--tile-color': colorVar } as CSSProperties) : undefined;
  const withheld = Boolean(revealsPattern && blinded);
  // A verdict is a word, not a reading: it stays small, unglowing, and on the ink's own text
  // colour. That is also what keeps it outside `palette.test.ts`'s LARGE-text claim, which only
  // holds for a numeral at --fs-2xl in a signal colour. `wide` is how a module already declares
  // "this value is a verdict rather than a number" — see the prop's own docblock.
  const isVerdict = Boolean(wide || revealsPattern);
  usePublishedTile({ moduleId, label, value, unit, secondary: hint === '' ? undefined : hint, withheld });

  return (
    <div className={wide ? `${styles.tile} ${styles.wide}` : styles.tile}>
      {/* Looks its own label up, so a module gains definitions without being touched. The
          module id goes with it because some labels are the module's own word — `State`,
          micturition's `Volume` — and mean something different one page over. */}
      <span className={`label ${styles.label}`}>
        <Term label={label} moduleId={moduleId} />
      </span>
      <div className={styles.valueRow}>
        {/* The colour rides the NUMBER now, not its label. A signal colour naming a quantity
            while the quantity itself sat in plain text was the wrong half lit. */}
        <span
          className={isVerdict ? `${styles.value} ${styles.verdict}` : styles.value}
          style={isVerdict ? undefined : style}
        >
          {withheld ? '—' : value}
        </span>
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

/**
 * Offer this tile to the tutor for as long as it is on screen.
 *
 * Written from a commit effect with no dep array rather than during render: what the tutor can
 * read should be what the learner can see, never a frame React rendered and discarded. See
 * `tileRegistry.ts` for why the tile is the publisher rather than the page.
 */
function usePublishedTile(tile: {
  moduleId: string;
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  withheld: boolean;
}): void {
  const id = useRef<number | null>(null);
  id.current ??= claimTile();

  useEffect(() => {
    setTile(id.current as number, tile);
  });

  useEffect(() => {
    const claimed = id.current as number;
    return () => releaseTile(claimed);
  }, []);
}

export const ReadoutItem = memo(ReadoutItemBase);
