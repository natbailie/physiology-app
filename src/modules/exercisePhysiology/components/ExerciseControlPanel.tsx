import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { ExerciseInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: ExerciseInputs;
  onChange: <K extends keyof ExerciseInputs>(key: K, value: ExerciseInputs[K]) => void;
}

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Workload"
        value={inputs.workloadWatts}
        min={0}
        max={400}
        step={5}
        unit=" W"
        onChange={(v) => onChange('workloadWatts', v)}
      />
      <Slider
        label="Training status"
        value={inputs.fitnessPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={(v) => Math.round(v).toString()}
        onChange={(v) => onChange('fitnessPct', v)}
      />
      <Slider
        label="Age"
        value={inputs.ageYears}
        min={20}
        max={80}
        step={1}
        unit=" years"
        onChange={(v) => onChange('ageYears', v)}
      />
      <Slider
        label="Hydration"
        value={inputs.hydrationPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={(v) => Math.round(v).toString()}
        onChange={(v) => onChange('hydrationPct', v)}
      />
    </ControlRail>
  );
}
