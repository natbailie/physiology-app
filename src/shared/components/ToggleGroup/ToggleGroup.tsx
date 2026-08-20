import styles from './ToggleGroup.module.css';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleGroupProps<T extends string> {
  label: string;
  value: T;
  options: ToggleOption<T>[];
  colorVar?: string;
  onChange: (value: T) => void;
}

/**
 * A labeled radio group for inputs that are genuinely categorical rather than continuous —
 * an ECG lead, a rhythm, a sex. Rendered as `role="radiogroup"` so it is keyboard-navigable
 * and announces as a single choice, rather than as several unrelated buttons.
 */
export function ToggleGroup<T extends string>({ label, value, options, colorVar, onChange }: ToggleGroupProps<T>) {
  return (
    <div
      className={styles.group}
      role="radiogroup"
      aria-label={label}
      style={colorVar ? ({ '--toggle-color': colorVar } as React.CSSProperties) : undefined}
    >
      <span className="label">{label}</span>
      <div className={styles.options}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={value === option.value ? styles.optionActive : styles.option}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
