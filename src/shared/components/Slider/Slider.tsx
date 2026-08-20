import type { CSSProperties } from 'react';
import styles from './Slider.module.css';

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
  const format = (v: number) => (formatValue ? formatValue(v) : v.toString());
  // Painted into the track as a filled progress bar, so the value is readable at a glance.
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;

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
        style={{ '--fill': `${fill}%` } as CSSProperties}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className={styles.bounds}>
        <span>
          {format(min)}
          {unit ?? ''}
        </span>
        <span>
          {format(max)}
          {unit ?? ''}
        </span>
      </div>
    </div>
  );
}
