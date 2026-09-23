import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { MotorInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MotorInputs;
  onChange: <K extends keyof MotorInputs>(key: K, value: MotorInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
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
      <Slider
        label="Dystonic co-contraction"
        value={inputs.dystoniaSeverityPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('dystoniaSeverityPct', v)}
      />
      {/* The stimulator is a device that is switched on and left on, so it belongs on the rail
          rather than behind a button that flipped hidden state. Mirrors the toggle the schema
          declares, which is what the phone renders — this page draws its own rail. */}
      <ToggleGroup
        label="Deep brain stimulation"
        value={inputs.deepBrainStimulation}
        options={[
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On' },
        ]}
        colorVar="var(--basal-ganglia)"
        onChange={(v) => onChange('deepBrainStimulation', v as MotorInputs['deepBrainStimulation'])}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
