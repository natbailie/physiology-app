import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { VenousReturnInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: VenousReturnInputs;
  onChange: <K extends keyof VenousReturnInputs>(key: K, value: VenousReturnInputs[K]) => void;
}

const multiple = (v: number) => `${v.toFixed(2)}x`;

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="Venous return curve">
        <Slider
          label="Blood volume"
          value={inputs.bloodVolumeMl}
          min={3000}
          max={7000}
          step={50}
          unit=" mL"
          onChange={(v) => onChange('bloodVolumeMl', v)}
        />
        <Slider
          label="Unstressed volume"
          value={inputs.unstressedVolumeFraction}
          min={0.6}
          max={0.95}
          step={0.01}
          unit="%"
          formatValue={(v) => Math.round(v * 100).toString()}
          onChange={(v) => onChange('unstressedVolumeFraction', v)}
        />
        <Slider
          label="Venous compliance"
          value={inputs.venousCompliance}
          min={0.3}
          max={3}
          step={0.05}
          formatValue={multiple}
          onChange={(v) => onChange('venousCompliance', v)}
        />
        <Slider
          label="Venous resistance"
          value={inputs.venousResistance}
          min={0.3}
          max={3}
          step={0.05}
          formatValue={multiple}
          onChange={(v) => onChange('venousResistance', v)}
        />
        <Slider
          label="AV shunt"
          value={inputs.arteriovenousShunt}
          min={0}
          max={1}
          step={0.05}
          unit="%"
          formatValue={(v) => Math.round(v * 100).toString()}
          onChange={(v) => onChange('arteriovenousShunt', v)}
        />
      </ControlGroup>

      <ControlGroup label="Cardiac function curve">
        <Slider
          label="Contractility"
          value={inputs.contractility}
          min={0}
          max={2.5}
          step={0.05}
          formatValue={multiple}
          onChange={(v) => onChange('contractility', v)}
        />
        <Slider
          label="Heart rate"
          value={inputs.heartRate}
          min={30}
          max={200}
          step={1}
          unit=" bpm"
          onChange={(v) => onChange('heartRate', v)}
        />
        <Slider
          label="Intrathoracic pressure"
          value={inputs.intrathoracicPressure}
          min={-10}
          max={20}
          step={0.5}
          unit=" mmHg"
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onChange('intrathoracicPressure', v)}
        />
      </ControlGroup>

      <Slider
        label="Systemic vascular resistance"
        value={inputs.systemicVascularResistance}
        min={0.3}
        max={3}
        step={0.05}
        formatValue={multiple}
        onChange={(v) => onChange('systemicVascularResistance', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
