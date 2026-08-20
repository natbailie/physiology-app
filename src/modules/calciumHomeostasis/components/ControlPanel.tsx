import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CalciumInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CalciumInputs;
  onChange: <K extends keyof CalciumInputs>(key: K, value: CalciumInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Dietary calcium"
        value={inputs.dietaryCalciumIntake}
        min={0}
        max={2000}
        step={50}
        unit=" mg"
        onChange={(v) => onChange('dietaryCalciumIntake', v)}
      />
      <Slider
        label="Dietary phosphate"
        value={inputs.dietaryPhosphateIntake}
        min={0}
        max={2000}
        step={50}
        unit=" mg"
        onChange={(v) => onChange('dietaryPhosphateIntake', v)}
      />
      <Slider
        label="Vitamin D intake"
        value={inputs.vitaminDIntake}
        min={0}
        max={200}
        step={5}
        unit="%"
        onChange={(v) => onChange('vitaminDIntake', v)}
      />
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
        label="Parathyroid function"
        value={inputs.parathyroidGlandFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('parathyroidGlandFunction', v)}
      />
      <Slider
        label="Serum magnesium"
        value={inputs.serumMagnesium}
        min={0.5}
        max={3}
        step={0.1}
        unit=" mg/dL"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('serumMagnesium', v)}
      />
      <Slider
        label="Autonomous PTH"
        value={inputs.autonomousPTHSecretion}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('autonomousPTHSecretion', v)}
      />
    
    </ControlRail>
  );
}
