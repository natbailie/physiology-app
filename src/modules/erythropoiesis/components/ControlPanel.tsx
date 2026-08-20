import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { ErythroInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: ErythroInputs;
  onChange: <K extends keyof ErythroInputs>(key: K, value: ErythroInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Renal function"
        value={inputs.renalFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('renalFunction', v)}
      />
      <Slider
        label="Iron availability"
        value={inputs.ironAvailability}
        min={0}
        max={150}
        step={1}
        unit="%"
        onChange={(v) => onChange('ironAvailability', v)}
      />
      <Slider
        label="B12 / folate"
        value={inputs.b12FolateStatus}
        min={0}
        max={150}
        step={1}
        unit="%"
        onChange={(v) => onChange('b12FolateStatus', v)}
      />
      <Slider
        label="Marrow function"
        value={inputs.marrowFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('marrowFunction', v)}
      />
      <Slider
        label="Chronic blood loss"
        value={inputs.bloodLossRate}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('bloodLossRate', v)}
      />
      <Slider
        label="Hemolysis"
        value={inputs.hemolysisRate}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('hemolysisRate', v)}
      />
      <Slider
        label="Inspired oxygen"
        value={inputs.inspiredOxygen}
        min={40}
        max={150}
        step={1}
        unit="%"
        onChange={(v) => onChange('inspiredOxygen', v)}
      />
    
    </ControlRail>
  );
}
