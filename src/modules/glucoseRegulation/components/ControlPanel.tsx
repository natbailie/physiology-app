import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { GlucoseInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: GlucoseInputs;
  onChange: <K extends keyof GlucoseInputs>(key: K, value: GlucoseInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Meal carbohydrate"
        value={inputs.mealCarbLoadGrams}
        min={0}
        max={150}
        step={5}
        unit="g"
        onChange={(v) => onChange('mealCarbLoadGrams', v)}
      />
      <Slider
        label="Insulin dose"
        value={inputs.exogenousInsulinUnits}
        min={0}
        max={20}
        step={1}
        unit=" U"
        onChange={(v) => onChange('exogenousInsulinUnits', v)}
      />
      <Slider
        label="Insulin secretion capacity"
        value={inputs.insulinSecretionCapacity}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('insulinSecretionCapacity', v)}
      />
      <Slider
        label="Insulin resistance"
        value={inputs.insulinResistance}
        min={0}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('insulinResistance', v)}
      />
      <Slider
        label="Glucagon secretion capacity"
        value={inputs.glucagonSecretionCapacity}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('glucagonSecretionCapacity', v)}
      />
    
    </ControlRail>
  );
}
