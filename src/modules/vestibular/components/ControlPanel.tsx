import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { VestibularInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: VestibularInputs;
  onChange: <K extends keyof VestibularInputs>(key: K, value: VestibularInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Head turn velocity"
        value={inputs.headTurnVelocityDegPerSec}
        min={-200}
        max={200}
        step={5}
        unit=" °/s"
        onChange={(v) => onChange('headTurnVelocityDegPerSec', v)}
      />
      <Slider
        label="Right canal function"
        value={inputs.rightCanalFunction}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('rightCanalFunction', v)}
      />
      <Slider
        label="Left canal function"
        value={inputs.leftCanalFunction}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('leftCanalFunction', v)}
      />
      <Slider
        label="Central compensation"
        value={inputs.centralCompensation}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('centralCompensation', v)}
      />
      <Slider
        label="Otolith function"
        value={inputs.otolithFunction}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('otolithFunction', v)}
      />
      <Slider
        label="Canalith debris (posterior)"
        value={inputs.canalithDebris}
        min={0}
        max={1}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('canalithDebris', v)}
      />
      <Slider
        label="Irritative drive (left nerve)"
        value={inputs.irritativeDriveLeft}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('irritativeDriveLeft', v)}
      />
    </ControlRail>
  );
}
