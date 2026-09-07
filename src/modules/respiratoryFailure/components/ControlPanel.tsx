import { memo } from 'react';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { RfInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: RfInputs;
  onChange: <K extends keyof RfInputs>(key: K, value: RfInputs[K]) => void;
}

const COURSE_OPTIONS = [
  { value: 'acute' as const, label: 'Acute' },
  { value: 'chronic' as const, label: 'Chronic (compensated)' },
];

const percent = (v: number) => Math.round(v * 100).toString();

export const ControlPanel = memo(function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Course"
        value={inputs.course}
        options={COURSE_OPTIONS}
        colorVar="var(--co2)"
        onChange={(value) => onChange('course', value)}
      />
      <Slider
        label="FiO2"
        value={inputs.fiO2}
        min={0.21}
        max={1}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('fiO2', v)}
      />
      <Slider
        label="Minute ventilation"
        value={inputs.minuteVentilation}
        min={3}
        max={24}
        step={0.5}
        unit=" L/min"
        onChange={(v) => onChange('minuteVentilation', v)}
      />
      <Slider
        label="V/Q shunt"
        value={inputs.shuntFraction}
        min={0}
        max={0.6}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('shuntFraction', v)}
      />
      <Slider
        label="CO2 production"
        value={inputs.co2ProductionMultiplier}
        min={0.6}
        max={2}
        step={0.05}
        unit="× resting"
        onChange={(v) => onChange('co2ProductionMultiplier', v)}
      />
    </ControlRail>
  );
});