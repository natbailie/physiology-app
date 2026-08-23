import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { MotorInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MotorInputs;
  onChange: <K extends keyof MotorInputs>(key: K, value: MotorInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Movement command"
        value={inputs.movementCommandAmplitude}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('movementCommandAmplitude', v)}
      />
      <Slider
        label="Striatal dopamine"
        value={inputs.dopamineFraction}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('dopamineFraction', v)}
      />
      <Slider
        label="Indirect-pathway loss"
        value={inputs.striatalOutputLoss}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('striatalOutputLoss', v)}
      />
      <Slider
        label="Subthalamic lesion"
        value={inputs.subthalamicLesion}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('subthalamicLesion', v)}
      />
      <Slider
        label="Cerebellar calibration"
        value={inputs.cerebellarCalibration}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('cerebellarCalibration', v)}
      />
      <Slider
        label="Corticospinal integrity"
        value={inputs.corticospinalIntegrity}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('corticospinalIntegrity', v)}
      />
      <Slider
        label="Essential tremor drive"
        value={inputs.essentialTremorDrive}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('essentialTremorDrive', v)}
      />
      <Slider
        label="Suppressant (beta-blocker/alcohol)"
        value={inputs.tremorSuppressantEffect}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('tremorSuppressantEffect', v)}
      />
    </ControlRail>
  );
}
