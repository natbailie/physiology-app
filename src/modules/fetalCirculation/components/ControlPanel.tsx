import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { FetalInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: FetalInputs;
  onChange: <K extends keyof FetalInputs>(key: K, value: FetalInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Placental circulation"
        value={inputs.placentalCirculation}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('placentalCirculation', v)}
      />
      <Slider
        label="Lung inflation"
        value={inputs.lungInflation}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('lungInflation', v)}
      />
      <Slider
        label="Inspired oxygen"
        value={inputs.inspiredOxygen}
        min={0.21}
        max={1}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('inspiredOxygen', v)}
      />
      <Slider
        label="Pulmonary vasoreactivity"
        value={inputs.pulmonaryVasoreactivity}
        min={0}
        max={2}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('pulmonaryVasoreactivity', v)}
      />
      <Slider
        label="Prostaglandin"
        value={inputs.prostaglandinLevel}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('prostaglandinLevel', v)}
      />
      <Slider
        label="Systemic tone"
        value={inputs.systemicToneScale}
        min={0.4}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('systemicToneScale', v)}
      />
    </ControlRail>
  );
}
