import styles from './PresetBar.module.css';

export interface PresetAction {
  label: string;
  onClick: () => void;
  /** 'impulse' = a one-off stimulus (Eat meal, Stimulate); 'danger' = an insult
   * applied to the model (Hemorrhage, Infect). Default is a plain preset button. */
  variant?: 'impulse' | 'danger';
}

interface PresetBarProps<T extends string> {
  order: readonly T[];
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
  labels,
  onApply,
  actions,
  onReset,
  disabled = false,
}: PresetBarProps<T>) {
  return (
    <div className={styles.bar}>
      <div className={styles.presets}>
        {order.map((name) => (
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
