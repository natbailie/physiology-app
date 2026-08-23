import styles from './PresetBar.module.css';

export interface PresetAction {
  label: string;
  onClick: () => void;
  /** 'impulse' = a one-off stimulus (Eat meal, Stimulate); 'danger' = an insult
   * applied to the model (Hemorrhage, Infect). Default is a plain preset button. */
  variant?: 'impulse' | 'danger';
}

export interface PresetGroup<T extends string> {
  label: string;
  order: readonly T[];
}

interface PresetBarProps<T extends string> {
  order: readonly T[];
  /**
   * Splits the scenarios into labelled runs.
   *
   * For a module whose presets fall into two genuinely different families — the four
   * mechanisms, and the same mechanisms met clinically — an undifferentiated row of eleven
   * buttons hides the structure that is half the teaching. Falls back to a single flat run
   * when absent, so existing modules are untouched.
   */
  groups?: readonly PresetGroup<T>[];
  labels: Record<T, string>;
  onApply: (name: T) => void;
  actions?: PresetAction[];
  onReset: () => void;
  /** Locks the bar while a pattern question is open. Loading a different scenario mid-question
   * would silently replace the one being asked about. */
  disabled?: boolean;
}

/** Scenario presets and one-off actions, pinned in ModulePage's sticky top bar —
 * the fastest path to a teaching point, so it stays reachable at every scroll position. */
export function PresetBar<T extends string>({
  order,
  groups,
  labels,
  onApply,
  actions,
  onReset,
  disabled = false,
}: PresetBarProps<T>) {
  const runs: readonly PresetGroup<T>[] = groups ?? [{ label: '', order }];

  return (
    <div className={styles.bar}>
      <div className={styles.presets}>
        {runs.map((run) => (
          <div key={run.label} className={styles.group}>
            {run.label && <span className={styles.groupLabel}>{run.label}</span>}
            {run.order.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.preset}
                disabled={disabled}
                onClick={() => onApply(name)}
              >
                {labels[name]}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {actions?.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.variant === 'danger' ? styles.danger : styles.impulse}
            disabled={disabled}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
        <button type="button" className={styles.reset} disabled={disabled} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
