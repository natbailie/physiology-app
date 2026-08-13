import styles from './ControlPanel.module.css';
import { PRESET_LABELS, type PresetName } from '@/simulation/presets';

interface PresetButtonsProps {
  onApplyPreset: (name: PresetName) => void;
}

const ORDER: PresetName[] = ['normal', 'heartFailure', 'kidneyFailure', 'highSaltDiet'];

export function PresetButtons({ onApplyPreset }: PresetButtonsProps) {
  return (
    <>
      {ORDER.map((name) => (
        <button key={name} type="button" className={styles.presetButton} onClick={() => onApplyPreset(name)}>
          {PRESET_LABELS[name]}
        </button>
      ))}
    </>
  );
}
