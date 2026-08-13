import styles from './ControlPanel.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, unit, formatValue, onChange }: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString();
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderHeader}>
        <span className="label">{label}</span>
        <span className={styles.sliderValue}>
          {displayValue}
          {unit ? unit : ''}
        </span>
      </div>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
