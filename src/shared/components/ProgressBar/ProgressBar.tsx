import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  /** What is being counted, for the accessible name: "Questions known". */
  label: string;
  /** Show "value / max" beside the bar. */
  showCount?: boolean;
  className?: string;
}

/**
 * A slim gradient progress bar. The numbers are always available as text (`showCount`) or through
 * `aria-valuetext`, so the state never rests on the fill alone.
 */
export function ProgressBar({ value, max, label, showCount = false, className }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), Math.max(max, 0));
  const pct = Math.round((clamped / safeMax) * 100);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={`${clamped} of ${max}`}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      {showCount && (
        <span className={styles.count}>
          {clamped}/{max}
        </span>
      )}
    </div>
  );
}
