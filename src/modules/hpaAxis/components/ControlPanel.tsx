import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { HpaInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: HpaInputs;
  onChange: <K extends keyof HpaInputs>(key: K, value: HpaInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Acute stress level"
        value={inputs.acuteStressLevel}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('acuteStressLevel', v)}
      />
      <Slider
        label="Exogenous glucocorticoid"
        value={inputs.exogenousGlucocorticoid}
        min={0}
        max={300}
        step={5}
        unit="%"
        onChange={(v) => onChange('exogenousGlucocorticoid', v)}
      />
      <Slider
        label="Pituitary function"
        value={inputs.pituitaryFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('pituitaryFunction', v)}
      />
      <Slider
        label="Adrenal cortex function"
        value={inputs.adrenalCortexFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('adrenalCortexFunction', v)}
      />
      <Slider
        label="Autonomous adrenal secretion"
        value={inputs.autonomousAdrenalSecretion}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('autonomousAdrenalSecretion', v)}
      />
    
    </ControlRail>
  );
}
