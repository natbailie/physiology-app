import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CardiacInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CardiacInputs;
  onChange: <K extends keyof CardiacInputs>(key: K, value: CardiacInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Intrinsic heart rate"
        value={inputs.intrinsicHeartRate}
        min={40}
        max={180}
        step={1}
        unit=" bpm"
        onChange={(v) => onChange('intrinsicHeartRate', v)}
      />
      <Slider
        label="Sympathetic drive"
        value={inputs.sympatheticDrive}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('sympatheticDrive', v)}
      />
      <Slider
        label="Vagal drive"
        value={inputs.parasympatheticDrive}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('parasympatheticDrive', v)}
      />
      <Slider
        label="Preload (EDV)"
        value={inputs.preloadEDV}
        min={60}
        max={220}
        step={5}
        unit=" mL"
        onChange={(v) => onChange('preloadEDV', v)}
      />
      <Slider
        label="Afterload"
        value={inputs.afterloadPressure}
        min={40}
        max={160}
        step={5}
        unit=" mmHg"
        onChange={(v) => onChange('afterloadPressure', v)}
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
        label="AV conduction delay"
        value={inputs.avConductionDelay}
        min={60}
        max={300}
        step={10}
        unit=" ms"
        onChange={(v) => onChange('avConductionDelay', v)}
      />
    
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
