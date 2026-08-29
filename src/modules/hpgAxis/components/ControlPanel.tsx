import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { HpgInputs, Sex } from '../engine/types';

interface ControlPanelProps {
  inputs: HpgInputs;
  onChange: <K extends keyof HpgInputs>(key: K, value: HpgInputs[K]) => void;
}

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  const isFemale = inputs.sex === 'female';

  return (
    <ControlRail>
      <ToggleGroup label="Axis" value={inputs.sex} options={SEX_OPTIONS} colorVar="var(--lh)" onChange={(value) => onChange('sex', value)} />

      <Slider
        label="GnRH pulse frequency"
        value={inputs.gnrhPulseFrequency}
        min={0}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('gnrhPulseFrequency', v)}
      />
      <Slider
        label="Hypothalamic suppression"
        value={inputs.hypothalamicSuppression}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('hypothalamicSuppression', v)}
      />
      <Slider
        label="Gonadal function"
        value={inputs.gonadalFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('gonadalFunction', v)}
      />
      {isFemale ? (
        <Slider
          label="Exogenous estrogen/progestin"
          value={inputs.exogenousEstrogenProgesterone}
          min={0}
          max={200}
          step={5}
          unit="%"
          onChange={(v) => onChange('exogenousEstrogenProgesterone', v)}
        />
      ) : (
        <Slider
          label="Exogenous testosterone"
          value={inputs.exogenousTestosterone}
          min={0}
          max={200}
          step={5}
          unit="%"
          onChange={(v) => onChange('exogenousTestosterone', v)}
        />
      )}
    
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
