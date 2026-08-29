import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { HptInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: HptInputs;
  onChange: <K extends keyof HptInputs>(key: K, value: HptInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Thyroid gland function"
        value={inputs.thyroidGlandFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('thyroidGlandFunction', v)}
      />
      <Slider
        label="Pituitary TSH function"
        value={inputs.pituitaryTshFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('pituitaryTshFunction', v)}
      />
      <Slider
        label="Autonomous thyroid stimulation"
        value={inputs.autonomousThyroidStimulation}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('autonomousThyroidStimulation', v)}
      />
      <Slider
        label="Exogenous levothyroxine"
        value={inputs.exogenousLevothyroxine}
        min={0}
        max={300}
        step={5}
        unit="%"
        onChange={(v) => onChange('exogenousLevothyroxine', v)}
      />
      <Slider
        label="Illness severity"
        value={inputs.illnessSeverity}
        min={0}
        max={100}
        step={5}
        onChange={(v) => onChange('illnessSeverity', v)}
      />
    
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
