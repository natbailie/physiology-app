import { Slider } from './Slider';
import { PresetButtons } from './PresetButtons';
import styles from './ControlPanel.module.css';
import type { SimInputs } from '@/simulation/types';
import type { PresetName } from '@/simulation/presets';

interface ControlPanelProps {
  inputs: SimInputs;
  onChange: <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => void;
  onApplyPreset: (name: PresetName) => void;
  onHemorrhage: () => void;
  onReset: () => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange, onApplyPreset, onHemorrhage, onReset }: ControlPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.slidersGrid}>
        <Slider
          label="Heart rate"
          value={inputs.heartRate}
          min={40}
          max={180}
          unit=" bpm"
          onChange={(v) => onChange('heartRate', v)}
        />
        <Slider
          label="Contractility"
          value={inputs.contractility}
          min={0}
          max={2}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('contractility', v)}
        />
        <Slider
          label="Vascular tone"
          value={inputs.vascularTone}
          min={0.5}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('vascularTone', v)}
        />
        <Slider
          label="Kidney function"
          value={inputs.kidneyFunction}
          min={0}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('kidneyFunction', v)}
        />
        <Slider
          label="Sodium intake"
          value={inputs.sodiumIntake}
          min={0}
          max={300}
          step={5}
          unit="%"
          onChange={(v) => onChange('sodiumIntake', v)}
        />
      </div>

      <div className={styles.actions}>
        <PresetButtons onApplyPreset={onApplyPreset} />
        <div className={styles.spacer} />
        <button type="button" className={styles.hemorrhageButton} onClick={onHemorrhage}>
          Hemorrhage
        </button>
        <button type="button" className={styles.presetButton} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
