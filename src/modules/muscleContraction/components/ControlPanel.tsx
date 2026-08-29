import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { MuscleInputs, MuscleType } from '../engine/types';

interface ControlPanelProps {
  inputs: MuscleInputs;
  onChange: <K extends keyof MuscleInputs>(key: K, value: MuscleInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

const MUSCLE_TYPE_OPTIONS: { value: MuscleType; label: string }[] = [
  { value: 'skeletal', label: 'Skeletal' },
  { value: 'cardiac', label: 'Cardiac' },
  { value: 'smooth', label: 'Smooth' },
];

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Muscle type"
        value={inputs.muscleType}
        options={MUSCLE_TYPE_OPTIONS}
        colorVar="var(--sarcomere)"
        onChange={(v) => onChange('muscleType', v)}
      />

      <ControlGroup label="Neural drive">
        <Slider
          label="Stimulation frequency"
          value={inputs.stimulationFrequencyHz}
          min={0}
          max={100}
          step={1}
          unit=" Hz"
          onChange={(v) => onChange('stimulationFrequencyHz', v)}
        />
        <Slider
          label="Motor units recruited"
          value={inputs.motorUnitRecruitment}
          min={0}
          max={1}
          step={0.01}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('motorUnitRecruitment', v)}
        />
      </ControlGroup>

      <ControlGroup label="Mechanics">
        <Slider
          label="Resting sarcomere length"
          value={inputs.restingSarcomereLengthUm}
          min={1.3}
          max={3.8}
          step={0.05}
          unit=" um"
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange('restingSarcomereLengthUm', v)}
        />
        <Slider
          label="Afterload"
          value={inputs.afterload}
          min={0}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('afterload', v)}
        />
      </ControlGroup>

      <ControlGroup label="Calcium handling">
        <Slider
          label="SERCA pump activity"
          value={inputs.sercaActivity}
          min={0}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('sercaActivity', v)}
        />
        <Slider
          label="RyR leak"
          value={inputs.ryrLeak}
          min={0}
          max={1}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('ryrLeak', v)}
        />
        <Slider
          label="Extracellular Ca2+"
          value={inputs.extracellularCalcium}
          min={0.5}
          max={2}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('extracellularCalcium', v)}
        />
      </ControlGroup>

      <Slider
        label="ATP availability"
        value={inputs.atpAvailability}
        min={0}
        max={1}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('atpAvailability', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
