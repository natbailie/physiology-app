import { useState } from 'react';
import type { FormulaDefinition } from '../formulas';
import styles from './FormulaCard.module.css';

interface FormulaCardProps {
  formula: FormulaDefinition;
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return (Math.round(value * 100) / 100).toString();
}

/** A single formula: display + live-calculated result from user-entered values.
 * Uses plain number inputs (not the shared Slider) since precise clinical values
 * matter more here than the coarse drag-to-explore interaction sliders are built for. */
export function FormulaCard({ formula }: FormulaCardProps) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(formula.inputs.map((input) => [input.key, input.default])),
  );

  function handleChange(key: string, raw: string) {
    const parsed = Number(raw);
    setValues((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : (prev[key] ?? 0) }));
  }

  const result = formula.compute(values);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{formula.name}</span>
        <span className={`numeral ${styles.formulaDisplay}`}>{formula.formulaDisplay}</span>
      </div>

      <div className={styles.inputs}>
        {formula.inputs.map((input) => (
          <label key={input.key} className={styles.inputRow}>
            <span className="label">{input.label}</span>
            <span className={styles.inputControl}>
              <input
                className={styles.numberInput}
                type="number"
                value={values[input.key]}
                min={input.min}
                max={input.max}
                step={input.step ?? 1}
                onChange={(e) => handleChange(input.key, e.target.value)}
              />
              {input.unit && <span className={styles.unit}>{input.unit}</span>}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.resultRow}>
        <span className="label">{formula.resultLabel}</span>
        <span className={`numeral ${styles.result}`}>
          {formatResult(result)}
          {formula.resultUnit && <span className={styles.resultUnit}> {formula.resultUnit}</span>}
        </span>
      </div>

      <p className={styles.explanation}>{formula.explanation}</p>
    </div>
  );
}
