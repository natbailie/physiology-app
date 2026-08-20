import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { GiInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: GiInputs;
  onChange: <K extends keyof GiInputs>(key: K, value: GiInputs[K]) => void;
}

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider label="Meal fat" value={inputs.mealFatGrams} min={0} max={100} step={5} unit="g" onChange={(v) => onChange('mealFatGrams', v)} />
      <Slider
        label="Meal protein"
        value={inputs.mealProteinGrams}
        min={0}
        max={100}
        step={5}
        unit="g"
        onChange={(v) => onChange('mealProteinGrams', v)}
      />
      <Slider
        label="Meal carbohydrate"
        value={inputs.mealCarbGrams}
        min={0}
        max={150}
        step={5}
        unit="g"
        onChange={(v) => onChange('mealCarbGrams', v)}
      />
      <Slider
        label="Meal volume"
        value={inputs.mealVolumeML}
        min={0}
        max={1000}
        step={25}
        unit="mL"
        onChange={(v) => onChange('mealVolumeML', v)}
      />
      <Slider label="Vagal tone" value={inputs.vagalTone} min={0} max={200} step={5} unit="%" onChange={(v) => onChange('vagalTone', v)} />
      <Slider label="PPI dose" value={inputs.ppiDose} min={0} max={150} step={5} unit="%" onChange={(v) => onChange('ppiDose', v)} />
      <Slider
        label="H2 blocker dose"
        value={inputs.h2BlockerDose}
        min={0}
        max={150}
        step={5}
        unit="%"
        onChange={(v) => onChange('h2BlockerDose', v)}
      />
      <Slider
        label="Autonomous gastrin"
        value={inputs.autonomousGastrinSecretion}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('autonomousGastrinSecretion', v)}
      />
    
    </ControlRail>
  );
}
