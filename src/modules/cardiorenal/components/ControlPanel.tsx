import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { SimInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: SimInputs;
  onChange: <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
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
    </ControlRail>
  );
}
