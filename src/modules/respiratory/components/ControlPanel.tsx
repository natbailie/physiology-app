import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { AcidType, RespInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: RespInputs;
  onChange: <K extends keyof RespInputs>(key: K, value: RespInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

/** Two acidoses with identical pH and bicarbonate that only the anion gap separates. */
const ACID_TYPE_OPTIONS: { value: AcidType; label: string }[] = [
  { value: 'anionGap', label: 'Organic (gap)' },
  { value: 'hyperchloraemic', label: 'Hyperchloraemic' },
];

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Minute ventilation"
        value={inputs.minuteVentilation}
        min={20}
        max={300}
        step={5}
        unit="%"
        onChange={(v) => onChange('minuteVentilation', v)}
      />
      <Slider
        label="Inspired O2 (FiO2)"
        value={inputs.fiO2}
        min={0.05}
        max={1}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('fiO2', v)}
      />
      <Slider
        label="CO2 production"
        value={inputs.co2Production}
        min={50}
        max={300}
        step={5}
        unit="%"
        onChange={(v) => onChange('co2Production', v)}
      />
      <Slider
        label="Metabolic acid load"
        value={inputs.metabolicAcidLoad}
        min={-100}
        max={100}
        step={5}
        onChange={(v) => onChange('metabolicAcidLoad', v)}
      />
      <ToggleGroup
        label="Acid type"
        value={inputs.acidType}
        options={ACID_TYPE_OPTIONS}
        colorVar="var(--ph)"
        onChange={(value) => onChange('acidType', value)}
      />
      <Slider
        label="Renal compensation capacity"
        value={inputs.renalCompensationCapacity}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('renalCompensationCapacity', v)}
      />
    
    </ControlRail>
  );
}
